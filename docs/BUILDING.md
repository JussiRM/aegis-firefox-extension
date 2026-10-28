# Reproducing the Mozilla submission

The runtime ZIP and the separate `-sources.zip` are generated together by
`npm run package`. Upload the runtime ZIP as the add-on and the source ZIP as
its matching sources. The source ZIP contains original Vue/TypeScript/Sass,
maintained manifest/icons, licenses, tests, build scripts, and the npm lockfile.
It excludes generated bundles and `node_modules`.

## Release build environment

Version 1.1.1 was built on Fedora Linux 44, x86_64, using:

- Node.js 22.23.1 and npm 10.9.8
- Python 3.14.8 for packaging and the optional browser test
- Firefox 158.0.1 for the browser test

The extension declares Firefox 142 or later. The release smoke test used the
Firefox version above; Firefox 142 was not independently tested.

Install Node.js using the [official installation instructions](https://nodejs.org/en/download).
Use the stated Node/npm versions when comparing builds. Python is available
through your operating system's package manager or [python.org](https://www.python.org/downloads/).
The build tools are open source and pinned in `package-lock.json`. `npm ci`
downloads dependencies from the official npm registry. No global build tools,
private repositories, credentials, or custom npm registry are needed.

## Build from the extracted source archive

Open a terminal in the directory containing `package.json`, then run:

```sh
npm ci
npm run build
```

The generated extension is in `extension/`. Compare **all file names and file
contents** in that directory to the extracted runtime ZIP. They must match.
The JavaScript and CSS are intentionally unminified. Build output includes Vue's
runtime, compiled templates, and `@noble/hashes` scrypt; no remote code is loaded.

To recreate both submission ZIPs and their checksums, run:

```sh
npm run package
```

This requires Python 3 and produces:

- `artifacts/aegis-viewer-1.1.1.zip`
- `artifacts/aegis-viewer-1.1.1-sources.zip`
- `artifacts/aegis-viewer-1.1.1-SHA256SUMS.txt`

ZIP entry timestamps and file permissions are fixed for reproducibility.

## Verification

```sh
npm test
npm run lint
python3 scripts/test-firefox.py
npm audit --omit=dev
```

The browser test needs an installed Firefox and permission to open a local
Marionette socket. It uses a disposable profile, never your normal profile.
Its test-only hooks are injected into a temporary archive, never the runtime ZIP.
It may refresh screenshots under `artifacts/`; those images are not packaged.

The linter reports one known Vue static-template `innerHTML` warning.
`scripts/lint.mjs` accepts only the exact assignment in Vue's static renderer;
other warnings and all errors fail validation. User-controlled account values
are escaped through Vue interpolation; the application does not use `v-html`.

See [AMO-LISTING.md](AMO-LISTING.md) for reviewer instructions, public demo data,
permission explanations, and listing text.
