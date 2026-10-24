"""Create an unsigned installable archive, without shipping source or tests."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
extension = root / "extension"
version = json.loads((extension / "manifest.json").read_text())["version"]
output = root / "artifacts" / f"aegis-viewer-{version}.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for path in sorted(extension.rglob("*")):
        if path.is_file():
            archive.write(path, path.relative_to(extension))
print(output)
