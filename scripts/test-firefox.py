"""Integration smoke test in an isolated, headless Firefox profile.

Uses Firefox's built-in Marionette endpoint; no Selenium or browser download.
All data are public test secrets. The user's Firefox profile is never opened.
"""
import base64
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
ADDON_ID = "firefox-aegis@local.extension"
UUID = "79cc6253-2429-4bcb-9020-d87ca1a3a77d"


class Marionette:
    def __init__(self, connection):
        self.connection = connection
        self.sequence = 0
        self.receive()  # protocol greeting

    def receive(self):
        length = b""
        while (char := self.connection.recv(1)) != b":":
            if not char:
                raise RuntimeError("Firefox closed its debugging connection")
            length += char
        content = b""
        while len(content) < int(length):
            content += self.connection.recv(int(length) - len(content))
        return json.loads(content)

    def command(self, name, params=None):
        self.sequence += 1
        message = json.dumps([0, self.sequence, name, params or {}]).encode()
        self.connection.sendall(str(len(message)).encode() + b":" + message)
        result = self.receive()
        if result[2]:
            raise RuntimeError(f"{name}: {result[2]}")
        return result[3]

    def js(self, script, args=None):
        result = self.command("WebDriver:ExecuteScript", {"script": script, "args": args or [], "newSandbox": False, "sandbox": None})
        return result.get("value")

    def wait(self, expression, timeout=15):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            try:
                if self.js(f"return Boolean({expression})"):
                    return
            except RuntimeError as error:
                if "javascript error" not in str(error):
                    raise
            time.sleep(0.1)
        raise AssertionError(f"Timed out: {expression}; page: {self.js('return location.href')}; status: {self.js('return document.getElementById("status")?.textContent')}")

    def click(self, selector):
        self.js("document.querySelector(arguments[0]).click()", [selector])

    def fill(self, selector, value):
        self.js("const el = document.querySelector(arguments[0]); el.value = arguments[1]; el.dispatchEvent(new Event('input', {bubbles:true}));", [selector, value])

    def clock(self, timestamp):
        self.js("document.dispatchEvent(new CustomEvent('__firefox_aegis_test_clock', {detail: arguments[0]}));", [timestamp])

    def navigate(self, url):
        # WebDriver blocks direct extension URL navigation; navigate from
        # Firefox's browser context in this disposable profile instead.
        self.command("Marionette:SetContext", {"value": "chrome"})
        self.js("window.gBrowser.loadURI(Services.io.newURI(arguments[0]), {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});", [url])
        self.command("Marionette:SetContext", {"value": "content"})

    def upload(self, path):
        found = self.command("WebDriver:FindElement", {"using": "css selector", "value": "#file"})
        element_id = found["value"]["element-6066-11e4-a52e-4f735466cecf"]
        self.command("WebDriver:ElementSendKeys", {"id": element_id, "text": str(path), "value": list(str(path))})
        self.wait("!document.getElementById('import-password').hidden && !document.getElementById('import-secret').disabled")


def main():
    firefox = shutil.which("firefox")
    if not firefox:
        raise SystemExit("Firefox must be installed for this test.")
    with tempfile.TemporaryDirectory(prefix="firefox-aegis-test-") as temporary:
        directory = Path(temporary)
        profile = directory / "profile"
        profile.mkdir()
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        preferences = {
            "marionette.port": port,
            "extensions.webextensions.uuids": json.dumps({ADDON_ID: UUID}),
            "browser.shell.checkDefaultBrowser": False,
            "browser.startup.homepage_override.mstone": "ignore",
            "browser.startup.homepage": "about:blank",
            "browser.startup.page": 0,
            "browser.aboutwelcome.enabled": False,
            "datareporting.policy.dataSubmissionEnabled": False,
            "toolkit.telemetry.reportingpolicy.firstRun": False,
        }
        (profile / "user.js").write_text("\n".join(f"user_pref({json.dumps(key)}, {json.dumps(value)});" for key, value in preferences.items()))
        archive = directory / "test.zip"
        with ZipFile(archive, "w") as output:
            for path in (ROOT / "extension").rglob("*"):
                if path.is_file():
                    if path.name == "app.js":
                        # Extension scripts use a separate JS realm from
                        # WebDriver. Inject a controllable clock into ONLY the
                        # disposable test archive, never the shipped bundle.
                        clock = """(() => {
                          const realNow = Date.now.bind(Date); let clock = null;
                          Date.now = () => clock ?? realNow();
                          document.addEventListener('__firefox_aegis_test_clock', event => {
                            clock = event.detail;
                            document.dispatchEvent(new Event('visibilitychange'));
                          });
                        })();\n"""
                        output.writestr("app.js", clock + path.read_text())
                    else:
                        output.write(path, path.relative_to(ROOT / "extension"))
        log = (directory / "firefox.log").open("w")
        def launch():
            process = subprocess.Popen([firefox, "--headless", "--no-remote", "--remote-allow-system-access", "--profile", str(profile), "--marionette"], stdout=log, stderr=log, env={**os.environ, "MOZ_HEADLESS": "1"})
            connection = None
            for _ in range(150):
                try:
                    connection = socket.create_connection(("127.0.0.1", port), timeout=30)
                    break
                except ConnectionRefusedError:
                    if process.poll() is not None:
                        raise RuntimeError((directory / "firefox.log").read_text())
                    time.sleep(0.1)
            assert connection, "Firefox did not start Marionette"
            client = Marionette(connection)
            client.command("WebDriver:NewSession", {"capabilities": {"alwaysMatch": {"acceptInsecureCerts": True}}})
            client.command("WebDriver:SetWindowRect", {"width": 1000, "height": 1100})
            client.command("Addon:Install", {"path": str(archive), "temporary": True})
            return process, client

        process, client = launch()
        try:
            url = f"moz-extension://{UUID}/app.html?tab=1"
            client.navigate(url)
            client.wait("!document.getElementById('welcome').hidden && !document.getElementById('first-import').disabled")
            client.upload(ROOT / "tests/fixtures/demo.json")
            client.fill("#import-secret", "test password")
            client.fill("#confirm-secret", "test password")
            client.click("#import-form button[type=submit]")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            client.wait("/^[0-9 ]+$/.test(document.querySelector('.code').textContent)")
            assert client.js("return Array.from(document.querySelectorAll('#group button'), button => button.textContent)") == ["All accounts (4)", "Ungrouped (1)", "Personal (2)", "Work (2)"]
            assert client.js("return document.querySelector('#group [aria-pressed=true]').dataset.group") == "all"
            assert client.js("return document.getElementById('skipped-summary').textContent").startswith("1 ")
            client.clock(59000)
            client.wait("document.querySelector('.code').textContent === '287 082'")
            client.clock(60000)
            client.wait("document.querySelector('.code').textContent === '359 152'")
            assert client.js("return document.querySelector('.entry progress').value") == 30
            client.click(".code")
            client.wait("document.querySelector('.entry .copy-shine')")
            assert not client.js("return document.getElementById('status').textContent.includes('Code copied')")
            client.click('#group [data-group="group:work"]')
            client.wait("document.querySelectorAll('.entry').length === 2")
            assert client.js("return document.querySelectorAll('#group [aria-pressed=true]').length") == 1
            assert client.js("return document.querySelector('#group [aria-pressed=true]').dataset.group") == "group:work"
            client.fill("#search", "cloud")
            client.wait("document.querySelectorAll('.entry').length === 1")
            client.fill("#search", "not-found")
            assert client.js("return !document.getElementById('no-results').hidden")
            client.fill("#search", "")
            client.click('#group [data-group="ungrouped"]')
            client.wait("document.querySelectorAll('.entry').length === 1")
            client.click('#group [data-group="all"]')
            client.wait("document.querySelector('.code').textContent === '359 152'")
            (ROOT / "artifacts").mkdir(exist_ok=True)
            screenshot = client.command("WebDriver:TakeScreenshot", {"full": True})["value"]
            (ROOT / "artifacts/preview.png").write_bytes(base64.b64decode(screenshot))
            client.click("#lock")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            assert client.js("return document.querySelectorAll('.entry').length") == 0
            client.fill("#unlock-password", "wrong password")
            client.click("#unlock-form button")
            client.wait("document.getElementById('status').classList.contains('error') && !document.getElementById('unlock-password').disabled")
            client.fill("#unlock-password", "test password")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            # Closing/reloading a view keeps the browser-session unlock.
            client.command("WebDriver:Refresh")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            # Opening the popup document restores the vault and focuses search.
            client.navigate(url.split("?")[0])
            client.wait("document.activeElement?.id === 'search' && !document.getElementById('search').disabled")
            client.navigate(url)
            client.wait("document.querySelectorAll('.entry').length === 4 && document.activeElement?.id === 'search'")
            # Import the real upstream encrypted export, including a failed attempt.
            client.upload(ROOT / "tests/fixtures/upstream-encrypted.json")
            client.fill("#import-secret", "wrong")
            client.click("#import-form button[type=submit]")
            client.wait("document.getElementById('status').classList.contains('error') && !document.getElementById('import-secret').disabled")
            # Cancelling a failed replacement keeps the previous saved vault.
            client.click("#cancel-import")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            client.upload(ROOT / "tests/fixtures/upstream-encrypted.json")
            client.fill("#import-secret", "test")
            client.click("#import-form button[type=submit]")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            # Inactivity no longer locks the vault during the browser session.
            client.clock(9000000000000)
            client.wait("/^[0-9 ]+$/.test(document.querySelector('.code').textContent)")
            client.command("WebDriver:Refresh")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            # The unlock survives when there are no open extension views.
            client.navigate("about:blank")
            client.wait("location.href === 'about:blank'")
            client.navigate(url)
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")

            first = client.command("WebDriver:GetWindowHandle")["value"]
            second = client.command("WebDriver:NewWindow", {"type": "tab"})["handle"]
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.navigate(url)
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            client.click("#lock")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.command("WebDriver:SwitchToWindow", {"handle": first})
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")

            # A real browser process restart clears the session unlock while
            # preserving the encrypted vault in the same disposable profile.
            client.command("WebDriver:DeleteSession")
            client.connection.close()
            process.terminate()
            process.wait(timeout=10)
            process, client = launch()
            client.navigate(url)
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            assert client.js("return document.querySelectorAll('.entry').length") == 0
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            client.click("#forget")
            client.click("#confirm-remove")
            client.wait("!document.getElementById('welcome').hidden && !document.getElementById('first-import').disabled")
            client.command("WebDriver:Refresh")
            client.wait("!document.getElementById('welcome').hidden")
            print("PASS: Firefox imports, codes, copy and filters; unlock survives closed/reloaded views; manual lock syncs across tabs; real browser restart requires the password; vault removal persists.")
            client.command("WebDriver:DeleteSession")
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
            log.close()


if __name__ == "__main__":
    main()
