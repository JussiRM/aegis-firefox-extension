"""Create matching runtime and reviewer-source archives for Mozilla submission."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
extension = root / "extension"
version = json.loads((extension / "manifest.json").read_text())["version"]
artifacts = root / "artifacts"
artifacts.mkdir(exist_ok=True)
if any(json.loads((root / name).read_text())["version"] != version
       for name in ("package.json", "package-lock.json")):
    raise SystemExit("Manifest, package.json and lockfile versions must match.")


def write_archive(output, files, base):
    # Fixed timestamps and permissions make identical inputs produce identical
    # archives, independent of checkout times and the user's file permissions.
    with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(set(files)):
            info = ZipInfo(path.relative_to(base).as_posix(), (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, path.read_bytes(), compresslevel=9)
    print(output)


runtime = [extension / name for name in (
    "manifest.json", "app.html", "app.js", "app.css", "background.js",
    "LICENSE", "THIRD_PARTY_LICENSE.txt",
)]
runtime.extend(path for path in (extension / "icons").rglob("*") if path.is_file())
output = artifacts / f"aegis-viewer-{version}.zip"
write_archive(output, runtime, extension)

# Include everything needed to build and test, with only maintained extension
# assets. Exclude generated bundles, dependencies, caches and local profiles.
sources = [root / name for name in (
    "README.md", "LICENSE", "package.json", "package-lock.json",
    "tsconfig.json", "vite.config.ts", "extension/manifest.json",
)]
for directory in ("src", "scripts", "tests", "licenses", "docs", "extension/icons"):
    sources.extend(path for path in (root / directory).rglob("*")
                   if path.is_file() and not path.is_symlink()
                   and "__pycache__" not in path.parts
                   and not path.name.startswith(".")
                   and path.suffix not in (".pyc", ".pyo"))
source_output = artifacts / f"aegis-viewer-{version}-sources.zip"
write_archive(source_output, sources, root)
checksums = artifacts / f"aegis-viewer-{version}-SHA256SUMS.txt"
checksums.write_text("".join(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n"
                             for path in (output, source_output)))
print(checksums)
