"""Capture the current extension and compose the README showcase in Firefox.

Uses only public demo data in a disposable profile. Run npm run screenshots to
also refresh the settings and import screenshots from the Firefox smoke test.
"""
import base64
import json
import os
from pathlib import Path
import runpy
import shutil
import socket
import subprocess
import tempfile
import time
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "artifacts"
helpers = runpy.run_path(str(ROOT / "scripts/test-firefox.py"))
Marionette = helpers["Marionette"]
ADDON_ID, UUID = helpers["ADDON_ID"], helpers["UUID"]


def settle(client):
    client.wait("!document.getElementById('config').disabled && document.getElementById('status').hidden && document.getAnimations().filter(animation => !animation.effect?.target?.classList.contains('timer-fill')).every(animation => animation.playState !== 'running')")
    client.js("document.activeElement?.blur()")


def capture(client, filename):
    settle(client)
    main = client.command("WebDriver:FindElement", {"using": "css selector", "value": "main"})["value"]["element-6066-11e4-a52e-4f735466cecf"]
    data = client.command("WebDriver:TakeScreenshot", {"id": main})["value"]
    (ARTIFACTS / filename).write_bytes(base64.b64decode(data))
    return data


def main():
    firefox = shutil.which("firefox")
    if not firefox:
        raise SystemExit("Firefox must be installed to capture screenshots.")
    ARTIFACTS.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="aegis-viewer-screenshots-") as temporary:
        directory = Path(temporary)
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
            "ui.prefersReducedMotion": 1,
            "layout.css.devPixelsPerPx": "2.0",
        }
        (directory / "user.js").write_text("\n".join(f"user_pref({json.dumps(key)}, {json.dumps(value)});" for key, value in preferences.items()))
        archive = directory / "screenshots.zip"
        with ZipFile(archive, "w", ZIP_DEFLATED) as output:
            for path in sorted((ROOT / "extension").rglob("*")):
                if path.is_file():
                    if path.name == "app.js":
                        # Freeze public demo codes only in this disposable copy.
                        output.writestr("app.js", "Date.now = () => 1720000010000;\n" + path.read_text())
                    else:
                        output.write(path, path.relative_to(ROOT / "extension"))
        with (directory / "firefox.log").open("w") as log:
            process = subprocess.Popen([firefox, "--headless", "--no-remote", "--remote-allow-system-access", "--profile", str(directory), "--marionette"], stdout=log, stderr=log, env={**os.environ, "MOZ_HEADLESS": "1"})
            try:
                deadline = time.monotonic() + 30
                while True:
                    try:
                        connection = socket.create_connection(("127.0.0.1", port), timeout=30)
                        break
                    except ConnectionRefusedError:
                        if process.poll() is not None or time.monotonic() >= deadline:
                            raise RuntimeError((directory / "firefox.log").read_text())
                        time.sleep(0.1)
                client = Marionette(connection)
                client.command("WebDriver:NewSession", {"capabilities": {"alwaysMatch": {"acceptInsecureCerts": True}}})
                client.command("WebDriver:SetWindowRect", {"width": 1100, "height": 1000})
                client.command("Addon:Install", {"path": str(archive), "temporary": True})
                client.navigate(f"moz-extension://{UUID}/app.html")
                client.wait("!document.getElementById('welcome').hidden && !document.getElementById('first-import').disabled")
                client.upload(ROOT / "tests/fixtures/demo-encrypted.json")
                client.fill("#import-secret", "demo")
                client.click("#import-form button[type=submit]")
                client.wait("document.querySelectorAll('.entry').length === 24")
                settle(client)
                # Frame the screenshot copy without native scrollbar gutters.
                # None of these presentation styles affect the shipped app.
                client.js("Object.assign(document.querySelector('main').style, {height: '600px', overflow: 'hidden', paddingBottom: '16px'});")
                shots = {}
                for mode, color, group, count in [("light", "#f7efdf", "work", 10), ("dark", "#241a35", "gaming", 5)]:
                    client.click("#config")
                    client.click("#appearance-settings > summary")
                    client.click(f"#theme-{mode}")
                    settle(client)
                    client.fill("#theme-hex", color)
                    client.click("#custom-theme-form button[type=submit]")
                    settle(client)
                    client.click("#appearance-settings > summary")
                    client.click("#config")
                    client.js("Array.from(document.querySelectorAll('#group button')).find(button => button.textContent.startsWith(arguments[0])).click()", [group.title() + " ("])
                    client.wait(f"document.querySelectorAll('.entry').length === {count}")
                    client.js("const main = document.querySelector('main'); main.scrollTop = 0; main.style.height = arguments[0]", ["620px" if mode == "dark" else "600px"])
                    shots[mode] = capture(client, f"preview-{mode}.png")

                # Compose the two real screenshots on a transparent canvas.
                # Canvas transforms keep all captured text and UI intact.
                client.navigate("about:blank")
                client.js("""
                  const canvas = document.createElement('canvas');
                  canvas.width = 1600; canvas.height = 1600;
                  document.body.replaceChildren(canvas);
                  const context = canvas.getContext('2d');
                  context.scale(1.6, 1.6);
                  context.imageSmoothingQuality = 'high';
                  let loaded = 0;
                  const shots = arguments[0], images = {};
                  function panel(image, x, y, angle) {
                    const width = 520, height = width * image.height / image.width;
                    context.save();
                    context.translate(x, y); context.rotate(angle * Math.PI / 180);
                    context.shadowColor = 'rgba(0, 0, 0, 0.25)';
                    context.shadowBlur = 14; context.shadowOffsetY = 5;
                    context.fillStyle = '#fff';
                    context.beginPath(); context.roundRect(-width/2, -height/2, width, height, 26); context.fill();
                    context.shadowColor = 'transparent';
                    context.clip();
                    context.drawImage(image, -width/2, -height/2, width, height);
                    context.strokeStyle = 'rgba(128, 128, 128, 0.4)'; context.lineWidth = 1;
                    context.stroke();
                    context.restore();
                  }
                  for (const mode of ['light', 'dark']) {
                    const image = images[mode] = new Image();
                    image.onload = () => {
                      if (++loaded !== 2) return;
                      panel(images.light, 640, 545, 9);
                      panel(images.dark, 340, 455, -3);
                      document.documentElement.dataset.ready = 'true';
                    };
                    image.src = 'data:image/png;base64,' + shots[mode];
                  }
                """, [shots])
                client.wait("document.documentElement.dataset.ready === 'true'")
                data = client.js("return document.querySelector('canvas').toDataURL('image/png').split(',')[1]")
                (ARTIFACTS / "showoff.png").write_bytes(base64.b64decode(data))
                client.command("WebDriver:DeleteSession")
                connection.close()
                print("Updated preview-light.png, preview-dark.png, and showoff.png from current Firefox captures.")
            finally:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()


if __name__ == "__main__":
    main()
