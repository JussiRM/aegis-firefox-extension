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

    def pointer_click(self, selector):
        found = self.command("WebDriver:FindElement", {"using": "css selector", "value": selector})
        element_id = found["value"]["element-6066-11e4-a52e-4f735466cecf"]
        self.command("WebDriver:ElementClick", {"id": element_id})

    def fill(self, selector, value):
        self.js("const el = document.querySelector(arguments[0]); el.value = arguments[1]; el.dispatchEvent(new Event('input', {bubbles:true}));", [selector, value])

    def clock(self, timestamp):
        self.js("document.dispatchEvent(new CustomEvent('__aegis_viewer_test_clock', {detail: arguments[0]}));", [timestamp])

    def session_snapshot(self):
        self.js("delete document.documentElement.dataset.sessionSnapshot; document.dispatchEvent(new Event('__aegis_viewer_test_session')); ")
        self.wait("document.documentElement.dataset.sessionSnapshot")
        return json.loads(self.js("return document.documentElement.dataset.sessionSnapshot"))

    def navigate(self, url):
        # WebDriver blocks direct extension URL navigation; navigate from
        # Firefox's browser context in this disposable profile instead.
        self.command("Marionette:SetContext", {"value": "chrome"})
        self.js("window.gBrowser.loadURI(Services.io.newURI(arguments[0]), {triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()});", [url])
        self.command("Marionette:SetContext", {"value": "content"})
        self.wait(f"location.href === {json.dumps(url)} && document.readyState === 'complete'")

    def upload(self, path, *, encrypted=True, error=False):
        found = self.command("WebDriver:FindElement", {"using": "css selector", "value": "#file"})
        element_id = found["value"]["element-6066-11e4-a52e-4f735466cecf"]
        self.command("WebDriver:ElementSendKeys", {"id": element_id, "text": str(path), "value": list(str(path))})
        if error:
            self.wait("document.getElementById('status').classList.contains('error') && !document.getElementById('search').disabled")
        elif encrypted:
            self.wait("!document.getElementById('import-password').hidden && !document.getElementById('import-secret').disabled")
        else:
            self.wait("!document.getElementById('import-password').hidden && document.getElementById('encrypt-local') && !document.getElementById('encrypt-local').disabled")


def main():
    firefox = shutil.which("firefox")
    if not firefox:
        raise SystemExit("Firefox must be installed for this test.")
    with tempfile.TemporaryDirectory(prefix="aegis-viewer-test-") as temporary:
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
            "layout.css.prefers-color-scheme.content-override": 1,
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
                          document.addEventListener('__aegis_viewer_test_clock', event => {
                            clock = event.detail;
                            document.dispatchEvent(new Event('visibilitychange'));
                          });
                          document.addEventListener('__aegis_viewer_test_expire', async event => {
                            const cache = await browser.storage.session.get('unlockedVault');
                            cache.unlockedVault.unlockedAt = realNow() - 60_000 + (event.detail ?? 1_000);
                            await browser.storage.session.set(cache);
                            document.documentElement.dataset.expiryReady = 'true';
                          });
                          document.addEventListener('__aegis_viewer_test_session', async () => {
                            const cache = await browser.storage.session.get('unlockedVault');
                            const alarm = await browser.alarms.get('lock-vault');
                            document.documentElement.dataset.sessionSnapshot = JSON.stringify({
                              timestamp: cache.unlockedVault?.unlockedAt,
                              deadline: alarm?.scheduledTime,
                            });
                          });
                        })();
                        document.documentElement.dataset.cacheOnLoad = String(Boolean((await browser.storage.session.get('unlockedVault')).unlockedVault));
                        \n"""
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
            # Exercise the actual toolbar popup with real pointer clicks. A
            # native color dialog used to dismiss this view before saving.
            client.command("Marionette:SetContext", {"value": "chrome"})
            client.js("""
              const id = 'firefox-aegis_local_extension-browser-action';
              CustomizableUI.addWidgetToArea(id, CustomizableUI.AREA_NAVBAR);
            """)
            client.pointer_click("#firefox-aegis_local_extension-browser-action .unified-extensions-item-action-button")
            client.wait("document.querySelector('browser[webextension-view-type=popup]')")
            # Remote popup browsers are top-level contexts, not frames of
            # browser.xhtml. Target their existing Marionette actor directly.
            def popup_js(script):
                return client.js("""
                  const popup = document.querySelector('browser[webextension-view-type=popup]');
                  return popup.browsingContext.currentWindowGlobal.getActor('MarionetteCommands')
                    .executeScript(arguments[0], [], {timeout: 15000});
                """, [script])

            def popup_wait(expression):
                deadline = time.monotonic() + 15
                while time.monotonic() < deadline:
                    if popup_js(f"return Boolean({expression})"):
                        return
                    time.sleep(0.1)
                raise AssertionError(f"Popup timed out: {expression}")

            def popup_click(selector):
                client.js("""
                  const actor = document.querySelector('browser[webextension-view-type=popup]')
                    .browsingContext.currentWindowGlobal.getActor('MarionetteCommands');
                  return actor.findElement('css selector', arguments[0], {}).then(element =>
                    actor.clickElement(element, {toJSON: () => ({'moz:webdriverClick': true})}));
                """, [selector])

            popup_wait("document.getElementById('config') && !document.getElementById('config').disabled")
            popup_click("#config")
            popup_wait("document.getAnimations().length === 0")
            popup_wait("innerHeight === document.body.getBoundingClientRect().height")
            collapsed_height = popup_js("return innerHeight")

            def popup_animation_frames():
                return popup_js("""
                  return new Promise(resolve => {
                    const section = document.getElementById('appearance-settings');
                    const summary = section.querySelector('summary');
                    const frames = [];
                    let start;
                    function sample(time) {
                      start ??= time;
                      frames.push([section.getBoundingClientRect().height - summary.getBoundingClientRect().height, innerHeight,
                        document.documentElement.scrollWidth, document.documentElement.clientWidth]);
                      if (time - start < 500) requestAnimationFrame(sample); else resolve(frames);
                    }
                    document.querySelector('#appearance-settings > summary').click();
                    requestAnimationFrame(sample);
                  });
                """)

            # Opening and closing must retain the collapsed popup's viewport.
            for opening in [True, False]:
                frames = popup_animation_frames()
                full_height = max(frame[0] for frame in frames)
                assert any(0 < frame[0] < full_height for frame in frames)
                direction = 1 if opening else -1
                assert all(direction * (b[0] - a[0]) >= -1 for a, b in zip(frames, frames[1:])), frames
                assert all(frame[1] == collapsed_height for frame in frames), frames
                assert all(frame[2] <= frame[3] + 1 for frame in frames), frames
            assert popup_js("return !document.getElementById('appearance-settings').open")
            popup_click("#appearance-settings > summary")
            popup_wait("document.querySelector('#appearance-settings .settings-panel').getAnimations().length === 0")
            popup_click("#theme-picker")
            popup_wait("document.getElementById('theme-hue')")
            assert popup_js("return document.querySelector('input[type=color]') === null")
            initial_color = popup_js("return document.getElementById('theme-hex').value")
            popup_click("#theme-hue")
            popup_click("#theme-saturation")
            popup_click("#theme-lightness")
            picked_color = popup_js("return document.getElementById('theme-hex').value")
            assert picked_color != initial_color, "Pointer clicks must change the picked color"
            popup_click("#custom-theme-form button[type=submit]")
            popup_wait("!document.getElementById('config').disabled && document.getElementById('theme-picker').getAttribute('aria-expanded') === 'false' && document.getElementById('status').hidden")
            assert client.js("return document.getElementById('customizationui-widget-panel').state") == "open"
            client.js("document.getElementById('customizationui-widget-panel').hidePopup()")
            client.command("Marionette:SetContext", {"value": "content"})
            client.wait(f"document.getElementById('theme-hex').value === {json.dumps(picked_color)}")
            client.command("WebDriver:Refresh")
            client.wait("!document.getElementById('config').disabled")
            assert client.js("return document.getElementById('theme-hex').value") == picked_color
            client.click("#config")
            client.wait("!document.getElementById('settings').hidden")
            assert client.js("return document.querySelector('#settings h2').textContent") == "Settings"
            assert client.js("return Array.from(document.querySelectorAll('#settings details'), section => section.open)") == [False, False]
            client.pointer_click("#appearance-settings > summary")
            assert client.js("return document.getElementById('appearance-settings').open && !document.getElementById('lock-settings').open")
            client.wait("document.querySelector('#appearance-settings .settings-panel').getAnimations().length === 0")
            client.pointer_click("#lock-settings > summary")
            assert client.js("return document.getElementById('lock-settings').open")
            client.wait("document.querySelector('#lock-settings .settings-panel').getAnimations().length === 0")
            # Pause halfway through each direction to verify actual layout
            # interpolation, rather than just an open/closed attribute change.
            for opening in [False, True]:
                sample = client.js("""
                  const section = document.getElementById('lock-settings');
                  section.querySelector('summary').click();
                  const panel = section.querySelector('.settings-panel');
                  const animation = panel.getAnimations()[0];
                  animation.pause();
                  animation.currentTime = animation.effect.getTiming().duration / 2;
                  return [panel.getBoundingClientRect().height, panel.scrollHeight];
                """)
                assert 0 < sample[0] < sample[1], f"Expected an intermediate section height: {sample}"
                assert client.js("return document.querySelector('#lock-settings .settings-panel').inert") == (not opening)
                client.js("document.querySelector('#lock-settings .settings-panel').getAnimations()[0].finish()")
                client.wait(f"document.getElementById('lock-settings').open === {str(opening).lower()} && document.querySelector('#lock-settings .settings-panel').getAnimations().length === 0")
            client.js("""
              const summary = document.querySelector('#lock-settings > summary');
              summary.click(); summary.click(); summary.click();
            """)
            client.wait("!document.getElementById('lock-settings').open")
            # Enabling reduced motion during a transition settles immediately.
            client.js("document.querySelector('#lock-settings > summary').click(); document.querySelector('#lock-settings .settings-panel').getAnimations()[0].pause()")
            client.command("Marionette:SetContext", {"value": "chrome"})
            client.js("Services.prefs.setIntPref('ui.prefersReducedMotion', 1)")
            client.command("Marionette:SetContext", {"value": "content"})
            client.wait("matchMedia('(prefers-reduced-motion: reduce)').matches && document.querySelector('#lock-settings .settings-panel').getAnimations().length === 0")
            client.click("#lock-settings > summary")
            assert client.js("return !document.getElementById('lock-settings').open && document.querySelector('#lock-settings .settings-panel').getAnimations().length === 0")
            client.command("Marionette:SetContext", {"value": "chrome"})
            client.js("Services.prefs.clearUserPref('ui.prefersReducedMotion')")
            client.command("Marionette:SetContext", {"value": "content"})
            client.wait("!matchMedia('(prefers-reduced-motion: reduce)').matches")
            assert client.js("return document.getElementById('lock-after').value") == "restart"
            assert client.js("return Array.from(document.getElementById('lock-after').options, option => option.value)") == ["restart", "1", "5", "15", "30", "60"]
            assert client.js("return document.querySelectorAll('.theme-preset').length") == 12
            assert client.js("return document.getElementById('theme-light').getAttribute('aria-pressed')") == "true"
            light_surface = client.js("return getComputedStyle(document.getElementById('theme-hex')).backgroundColor")
            initial_background = client.js("return getComputedStyle(document.documentElement).backgroundColor")
            for mode in ["light", "dark"]:
                assert client.js(f"return document.querySelectorAll('#themes-{mode} .theme-preset').length") == 6
                for index in range(6):
                    selector = f"#themes-{mode} .theme-preset:nth-child({index + 1})"
                    client.click(selector)
                    client.wait(f"document.querySelector('{selector}').getAttribute('aria-pressed') === 'true' && !document.getElementById('config').disabled")
                    assert client.js(f"return document.getElementById('theme-{mode}').getAttribute('aria-pressed')") == "true"
                    assert client.js("return document.querySelectorAll('.theme-preset[aria-pressed=true]').length") == 1
                    color = client.js("return document.getElementById('theme-hex').value")
                    expected = f"rgb({int(color[1:3], 16)}, {int(color[3:5], 16)}, {int(color[5:7], 16)})"
                    assert client.js("return getComputedStyle(document.documentElement).backgroundColor") == expected
                    assert client.js("return getComputedStyle(document.querySelector('main')).backgroundColor") == expected
                    assert client.js("return getComputedStyle(document.documentElement).colorScheme") == mode
                    assert client.js("return getComputedStyle(document.getElementById('theme-hex')).colorScheme") == mode
                    if index == 0:
                        client.wait("document.getAnimations().every(animation => animation.playState !== 'running')")
                        screenshot = client.command("WebDriver:TakeScreenshot", {"full": True})["value"]
                        (ROOT / "artifacts").mkdir(exist_ok=True)
                        (ROOT / f"artifacts/themes-{mode}-preview.png").write_bytes(base64.b64decode(screenshot))
            assert client.js("return getComputedStyle(document.documentElement).backgroundColor") != initial_background
            client.command("WebDriver:Refresh")
            client.wait("!document.getElementById('config').disabled")
            client.click("#config")
            client.wait("!document.getElementById('settings').hidden")
            assert client.js("return document.getElementById('theme-dark').getAttribute('aria-pressed')") == "true"
            assert client.js("return document.querySelector('#themes-dark .theme-preset:last-child').getAttribute('aria-pressed')") == "true"
            client.click("#appearance-settings > summary")
            client.click("#theme-light")
            client.wait("document.getElementById('theme-light').getAttribute('aria-pressed') === 'true' && !document.getElementById('config').disabled")
            assert client.js("return document.querySelectorAll('.theme-preset[aria-pressed=true]').length") == 0
            client.fill("#theme-hex", "#xyz")
            client.wait("document.getElementById('theme-hex').getAttribute('aria-invalid') === 'true'")
            assert client.js("return document.querySelector('#custom-theme-form button[type=submit]').disabled")
            client.fill("#theme-hex", "#a3e")
            client.click("#custom-theme-form button[type=submit]")
            client.wait("document.getElementById('theme-hex').value === '#aa33ee' && !document.getElementById('config').disabled")
            client.command("WebDriver:Refresh")
            client.wait("!document.getElementById('config').disabled")
            client.click("#config")
            client.wait("!document.getElementById('settings').hidden")
            assert client.js("return document.getElementById('theme-hex').value") == "#aa33ee"
            client.click("#appearance-settings > summary")
            client.click("#theme-picker")
            client.wait("document.getElementById('theme-hue')")
            client.wait("document.getAnimations().every(animation => animation.playState !== 'running')")
            screenshot = client.command("WebDriver:TakeScreenshot", {"full": True})["value"]
            (ROOT / "artifacts").mkdir(exist_ok=True)
            (ROOT / "artifacts/settings-preview.png").write_bytes(base64.b64decode(screenshot))
            chosen_background = client.js("return getComputedStyle(document.documentElement).backgroundColor")
            assert chosen_background == 'rgb(170, 51, 238)'
            client.command("Marionette:SetContext", {"value": "chrome"})
            client.js("Services.prefs.setIntPref('layout.css.prefers-color-scheme.content-override', 0)")
            client.command("Marionette:SetContext", {"value": "content"})
            client.wait("matchMedia('(prefers-color-scheme: dark)').matches")
            client.wait("document.getAnimations().every(animation => animation.playState !== 'running')")
            assert client.js("return getComputedStyle(document.documentElement).backgroundColor") == chosen_background
            assert client.js("return getComputedStyle(document.querySelector('main')).backgroundColor") == chosen_background
            client.click("#theme-dark")
            client.wait("document.getElementById('theme-dark').getAttribute('aria-pressed') === 'true' && !document.getElementById('config').disabled")
            client.wait("document.getAnimations().every(animation => animation.playState !== 'running')")
            dark_surface = client.js("return getComputedStyle(document.getElementById('theme-hex')).backgroundColor")
            assert dark_surface != light_surface
            assert client.js("return getComputedStyle(document.querySelector('.theme-preset')).backgroundColor") == dark_surface
            assert client.js("return getComputedStyle(document.getElementById('theme-hex')).colorScheme") == "dark"
            assert client.js("return getComputedStyle(document.documentElement).backgroundColor") == chosen_background
            screenshot = client.command("WebDriver:TakeScreenshot", {"full": True})["value"]
            (ROOT / "artifacts/settings-dark-preview.png").write_bytes(base64.b64decode(screenshot))
            client.command("Marionette:SetContext", {"value": "chrome"})
            client.js("Services.prefs.setIntPref('layout.css.prefers-color-scheme.content-override', 1)")
            client.command("Marionette:SetContext", {"value": "content"})
            client.wait("!matchMedia('(prefers-color-scheme: dark)').matches")
            assert client.js("return getComputedStyle(document.getElementById('theme-hex')).backgroundColor") == dark_surface
            client.click("#theme-light")
            client.wait("document.getElementById('theme-light').getAttribute('aria-pressed') === 'true' && !document.getElementById('config').disabled")
            assert client.js("return getComputedStyle(document.getElementById('theme-hex')).colorScheme") == "light"
            client.click("#theme-picker")
            client.click("#config")
            client.upload(ROOT / "tests/fixtures/demo.json", encrypted=False)
            assert client.js("return document.getElementById('import-secret') === null")
            assert "Encrypt your local copy?" in client.js("return document.getElementById('import-title').textContent")
            assert client.js("return document.getElementById('import-without-password').checked")
            assert not client.js("return document.getElementById('encrypt-local').checked")
            assert client.js("return document.querySelectorAll('#import-form input[type=radio]').length") == 2
            assert client.js("return document.querySelectorAll('#import-password button').length") == 1
            assert client.js("return document.querySelector('#import-form button').textContent") == "Continue"
            assert client.js("return document.getElementById('cancel-import') === null")
            client.wait("document.getAnimations().every(animation => animation.playState !== 'running')")
            screenshot = client.command("WebDriver:TakeScreenshot", {"full": True})["value"]
            (ROOT / "artifacts/import-options-preview.png").write_bytes(base64.b64decode(screenshot))
            client.click("#encrypt-local")
            client.wait("document.getElementById('import-secret') && document.getElementById('confirm-secret')")
            assert client.js("return document.getElementById('encrypt-local').checked")
            screenshot = client.command("WebDriver:TakeScreenshot", {"full": True})["value"]
            (ROOT / "artifacts/import-encryption-preview.png").write_bytes(base64.b64decode(screenshot))
            client.fill("#import-secret", "discarded password")
            client.fill("#confirm-secret", "discarded password")
            client.click("#import-without-password")
            client.wait("document.getElementById('import-secret') === null && document.getElementById('confirm-secret') === null")
            client.click("#encrypt-local")
            client.wait("document.getElementById('import-secret')?.value === '' && document.getElementById('confirm-secret')?.value === ''")
            client.click("#import-without-password")
            client.wait("document.getElementById('import-secret') === null")
            assert client.js("return document.getElementById('import-secret') === null")
            assert client.js("return document.getElementById('import-form').checkValidity()")
            client.click("#import-form button[type=submit]")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            assert client.js("return document.getElementById('import-password').hidden")
            assert client.js("return document.getElementById('lock').hidden")
            assert client.session_snapshot() == {}, "Unencrypted imports must not need an unlock session or timer"
            client.click("#config")
            assert client.js("return document.getElementById('lock-after').disabled")
            assert "unencrypted" in client.js("return document.getElementById('lock-help').textContent")
            client.click("#config")
            invalid_plain = directory / "invalid-plain.json"
            invalid_plain.write_text(json.dumps({"version": 1, "db": {"version": 99, "entries": []}}))
            client.upload(invalid_plain, error=True)
            assert client.js("return document.querySelectorAll('.entry').length") == 4
            client.command("WebDriver:Refresh")
            client.wait("document.querySelectorAll('.entry').length === 4 && document.activeElement?.id === 'search'")
            assert client.js("return document.getElementById('lock').hidden")
            client.wait("/^[0-9 ]+$/.test(document.querySelector('.code').textContent)")
            assert client.js("return Array.from(document.querySelectorAll('#group button'), button => button.textContent)") == ["All accounts (4)", "Personal (2)", "Work (2)"]
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
            # Accounts without a group remain searchable without a separate filter.
            client.fill("#search", "dropbox")
            client.wait("document.querySelectorAll('.entry').length === 1")
            assert client.js("return document.querySelector('.entry').textContent.includes('Dropbox')")
            client.fill("#search", "")
            client.wait("document.querySelectorAll('.entry').length === 4")
            client.wait("document.querySelector('.code').textContent === '359 152'")
            # Show the default theme and let the account transition settle
            # before capturing the README preview.
            client.click("#config")
            client.wait("!document.getElementById('settings').hidden")
            client.click("#themes-light .theme-preset:first-child")
            client.wait("document.querySelector('#themes-light .theme-preset:first-child').getAttribute('aria-pressed') === 'true' && !document.getElementById('config').disabled")
            client.click("#config")
            client.wait("document.getElementById('settings').hidden && document.querySelectorAll('.entry').length === 4 && document.getAnimations().filter(animation => !animation.effect?.target?.classList.contains('timer-fill')).every(animation => animation.playState !== 'running')")
            client.js("document.activeElement?.blur()")
            main = client.command("WebDriver:FindElement", {"using": "css selector", "value": "main"})
            main_id = main["value"]["element-6066-11e4-a52e-4f735466cecf"]
            (ROOT / "artifacts").mkdir(exist_ok=True)
            screenshot = client.command("WebDriver:TakeScreenshot", {"id": main_id})["value"]
            (ROOT / "artifacts/preview.png").write_bytes(base64.b64decode(screenshot))
            # A plain vault reopens without a password after Firefox restarts.
            client.command("WebDriver:DeleteSession")
            client.connection.close()
            process.terminate()
            process.wait(timeout=10)
            process, client = launch()
            client.navigate(url)
            client.wait("document.querySelectorAll('.entry').length === 4 && document.activeElement?.id === 'search'")
            assert client.js("return document.getElementById('lock').hidden")
            assert client.session_snapshot() == {}
            # The same plain file can instead be protected with a local password.
            client.upload(ROOT / "tests/fixtures/demo.json", encrypted=False)
            client.click("#encrypt-local")
            client.wait("document.getElementById('import-secret') && document.getElementById('confirm-secret')")
            assert client.js("return document.getElementById('import-secret').minLength") == -1
            client.fill("#import-secret", "x")
            client.fill("#confirm-secret", "y")
            client.click("#import-form button[type=submit]")
            client.wait("document.getElementById('status').classList.contains('error') && !document.getElementById('import-secret').disabled")
            assert "do not match" in client.js("return document.getElementById('status').textContent")
            client.fill("#import-secret", "x")
            client.fill("#confirm-secret", "x")
            assert client.js("return document.getElementById('import-form').checkValidity()")
            client.click("#import-form button[type=submit]")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            assert not client.js("return document.getElementById('lock').hidden")
            client.click("#lock")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.command("WebDriver:Refresh")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.fill("#unlock-password", "x")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 4 && !document.getElementById('lock').disabled")
            # Replacing it with an encrypted export restores password locking.
            client.upload(ROOT / "tests/fixtures/upstream-encrypted.json")
            client.fill("#import-secret", "test")
            client.click("#import-form button[type=submit]")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            assert not client.js("return document.getElementById('lock').hidden")
            client.click("#lock")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            assert client.js("return document.querySelectorAll('.entry').length") == 0
            client.fill("#unlock-password", "wrong password")
            client.click("#unlock-form button")
            client.wait("document.getElementById('status').classList.contains('error') && !document.getElementById('unlock-password').disabled")
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            # Closing/reloading a view keeps the browser-session unlock.
            client.command("WebDriver:Refresh")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            # Opening the popup document restores the vault and focuses search.
            client.navigate(url.split("?")[0])
            client.wait("document.activeElement?.id === 'search' && !document.getElementById('search').disabled")
            client.navigate(url)
            client.wait("document.querySelectorAll('.entry').length === 3 && document.activeElement?.id === 'search'")
            # Import the real upstream encrypted export, including a failed attempt.
            client.upload(ROOT / "tests/fixtures/upstream-encrypted.json")
            client.fill("#import-secret", "wrong")
            client.click("#import-form button[type=submit]")
            client.wait("document.getElementById('status').classList.contains('error') && !document.getElementById('import-secret').disabled")
            # Reloading after a failed replacement keeps the previous saved vault.
            client.command("WebDriver:Refresh")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
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
            # Changing appearance syncs to other views without disturbing the
            # unlocked session or its deadline.
            theme_session = client.session_snapshot()
            client.click("#config")
            client.click("#appearance-settings > summary")
            client.click("#theme-picker")
            client.wait("document.getElementById('theme-hue')")
            assert client.js("return document.querySelector('input[type=color]') === null")
            client.fill("#theme-hue", "240")
            client.fill("#theme-saturation", "100")
            client.fill("#theme-lightness", "50")
            client.wait("document.getElementById('theme-hex').value === '#0000ff'")
            # Keep the chosen hue/saturation while crossing black and white.
            client.fill("#theme-lightness", "0")
            client.wait("document.getElementById('theme-hex').value === '#000000'")
            client.fill("#theme-lightness", "100")
            client.wait("document.getElementById('theme-hex').value === '#ffffff'")
            client.fill("#theme-lightness", "50")
            client.wait("document.getElementById('theme-hex').value === '#0000ff'")
            client.fill("#theme-hex", "#2563eb")
            client.wait("Math.round(document.getElementById('theme-hue').value) === 221")
            client.click("#custom-theme-form button[type=submit]")
            client.wait("document.getElementById('theme-hex').value === '#2563eb' && !document.getElementById('config').disabled")
            client.click("#theme-dark")
            client.wait("document.getElementById('theme-dark').getAttribute('aria-pressed') === 'true' && !document.getElementById('config').disabled")
            client.click("#config")
            assert client.session_snapshot() == theme_session
            dark_card = client.js("return getComputedStyle(document.querySelector('.entry')).backgroundColor")
            assert client.js("return getComputedStyle(document.getElementById('search')).backgroundColor") == dark_card
            assert client.js("return getComputedStyle(document.getElementById('remove-dialog')).backgroundColor") == dark_card
            assert client.js("return getComputedStyle(document.querySelector('.entry')).colorScheme") == "dark"
            client.command("WebDriver:SwitchToWindow", {"handle": first})
            client.wait("document.getElementById('theme-hex').value === '#2563eb' && document.getElementById('theme-dark').getAttribute('aria-pressed') === 'true'")
            assert client.js("return getComputedStyle(document.querySelector('.entry')).backgroundColor") == dark_card
            assert client.js("return document.querySelectorAll('.entry').length") == 3
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.click("#lock")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.command("WebDriver:SwitchToWindow", {"handle": first})
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")

            # Configure a timer and exercise the real background alarm. Only
            # the disposable test hook moves the unlock timestamp near expiry.
            client.clock(None)
            client.click("#config")
            client.click("#lock-settings > summary")
            client.js("const select = document.getElementById('lock-after'); select.value = '1'; select.dispatchEvent(new Event('change', {bubbles:true}));")
            client.wait("document.getElementById('lock-after').value === '1' && !document.getElementById('lock-after').disabled")
            client.click("#config")
            client.command("WebDriver:SwitchToWindow", {"handle": first})
            client.clock(None)

            # Reopening the popup resets the shared timer and updates the
            # deadline in the other, already-open view without a refresh loop.
            client.js("document.dispatchEvent(new CustomEvent('__aegis_viewer_test_expire', {detail: 5_000}))")
            client.wait("document.documentElement.dataset.expiryReady === 'true'")
            old_timer = client.session_snapshot()
            client.navigate(url.split("?")[0])
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            reset_timer = client.session_snapshot()
            assert reset_timer['timestamp'] > old_timer['timestamp'] + 50_000
            client.wait("!document.getElementById('lock').disabled")
            assert client.session_snapshot()['timestamp'] == reset_timer['timestamp'], "Storage refreshes must not repeatedly reset the timeout"
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.wait("!document.getElementById('lock').disabled")
            # Advance only this view past the old deadline; it must use the
            # new deadline rather than clearing the renewed shared session.
            client.clock(old_timer['timestamp'] + 61_000)
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            assert client.session_snapshot()['timestamp'] == reset_timer['timestamp']
            client.clock(None)
            client.command("WebDriver:SwitchToWindow", {"handle": first})

            client.js("document.dispatchEvent(new Event('__aegis_viewer_test_expire'))")
            client.wait("document.documentElement.dataset.expiryReady === 'true'")
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            client.js("document.dispatchEvent(new Event('__aegis_viewer_test_expire'))")
            client.wait("document.documentElement.dataset.expiryReady === 'true'")
            client.navigate("about:blank")
            client.command("WebDriver:SwitchToWindow", {"handle": first})
            client.navigate("about:blank")
            time.sleep(1.5)
            client.navigate(url)
            client.wait("!document.getElementById('unlock').hidden && !document.getElementById('unlock-password').disabled")
            assert client.js("return document.documentElement.dataset.cacheOnLoad") == "false", "The background alarm must remove secrets before a view reopens"
            client.click("#config")
            assert client.js("return document.getElementById('lock-after').value") == "1"
            client.click("#config")
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
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
            assert client.js("return document.getElementById('theme-hex').value") == "#2563eb"
            assert client.js("return document.getElementById('theme-dark').getAttribute('aria-pressed')") == "true"
            assert client.js("return getComputedStyle(document.getElementById('unlock-password')).backgroundColor") == dark_card
            client.fill("#unlock-password", "test")
            client.click("#unlock-form button")
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            # Replacing a timed encrypted vault with plain JSON clears its
            # session and alarm, and updates an already-open view as well.
            first = client.command("WebDriver:GetWindowHandle")["value"]
            second = client.command("WebDriver:NewWindow", {"type": "tab"})["handle"]
            client.command("WebDriver:SwitchToWindow", {"handle": second})
            client.navigate(url)
            client.wait("document.querySelectorAll('.entry').length === 3 && !document.getElementById('lock').disabled")
            client.upload(ROOT / "tests/fixtures/demo.json", encrypted=False)
            client.click("#import-form button[type=submit]")
            client.wait("document.querySelectorAll('.entry').length === 4 && document.getElementById('lock').hidden")
            deadline = time.monotonic() + 5
            while client.session_snapshot() != {}:
                assert time.monotonic() < deadline, "Plain replacement must clear the encrypted session and alarm"
                time.sleep(0.1)
            client.command("WebDriver:SwitchToWindow", {"handle": first})
            client.wait("document.querySelectorAll('.entry').length === 4 && document.getElementById('lock').hidden")
            client.clock(9000000000000)
            client.wait("/^[0-9 ]+$/.test(document.querySelector('.code').textContent)")
            assert client.js("return !document.getElementById('vault').hidden")
            client.click("#forget")
            client.click("#confirm-remove")
            client.wait("!document.getElementById('welcome').hidden && !document.getElementById('first-import').disabled")
            client.command("WebDriver:Refresh")
            client.wait("!document.getElementById('welcome').hidden")
            print("PASS: Plain JSON offers optional local encryption with password validation and locking, or password-free import and reopening after restart; invalid replacement preserves the vault; plain replacement clears the encrypted session and alarm across tabs; Firefox codes, copy, filters and themes work; encrypted vaults retain session, timed/manual locking and restart password checks; vault removal persists.")
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
