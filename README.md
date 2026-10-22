# Firefox Aegis

> **AI disclosure:** This extension was made entirely by AI.

A local Firefox extension for viewing TOTP codes from an [Aegis Authenticator](https://github.com/beemdevelopment/Aegis) JSON export. Supports encrypted exports, groups (including accounts in multiple groups and older named groups), search, individual countdowns, and click-to-copy codes.

## Load in Firefox

Requires Firefox **142 or later**.

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…**.
3. Select `extension/manifest.json` from this project.
4. Open the **Firefox Aegis** toolbar button. Choose **Choose Aegis JSON** to open the import tab, then select your export.
5. For an encrypted export, enter its Aegis password. For an unencrypted export, choose and confirm a local password to protect the saved copy.

The built `extension/` directory is included; Node is only needed when editing the source. Temporary add-ons are removed when Firefox restarts. For permanent installation in regular Firefox, submit the archive to Mozilla for signing (listed or unlisted). The unsigned archive in `artifacts/` is a distribution package for signing and temporary loading, not a signed production release.

## Export from Android

In Aegis, go to **Settings → Import & export → Export**, choose **Aegis (.JSON)**, and transfer the exported file to your computer. An encrypted export is recommended. Select the local file in the extension; nothing is uploaded.

Imports are snapshots. Export and load a new file when your Android vault changes. A successful import replaces the saved vault; failed imports leave the previous saved copy intact. Use **Remove vault** to delete the extension's copy without changing the original file.

## Privacy and behavior

- File reading, password derivation, decryption, and TOTP generation happen on this device. There are no servers, analytics, external fonts, remote code, content scripts, or website permissions. The extension's content security policy blocks network connections.
- Only encrypted vault data is saved in `browser.storage.local`. Encrypted Aegis exports retain their original scrypt/AES-256-GCM encryption. Unencrypted exports are wrapped with AES-256-GCM using a password-derived key (PBKDF2-HMAC-SHA-256, 600,000 iterations, random 32-byte salt and 12-byte nonce).
- Unlock once per Firefox session. Closing/reopening the popup, opening another view, reloading, and inactivity do not prompt again. The extension keeps the TOTP data needed to reopen the vault in Firefox's in-memory [`browser.storage.session`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/session); it is not saved to disk by that API and is cleared when Firefox stops or the extension is disabled/reloaded. Passwords are never cached. The persistent copy stays encrypted. JavaScript does not guarantee immediate physical erasure of memory.
- **Lock** clears the shared session cache and locks all open views. **Remove vault** clears both the session cache and the encrypted saved copy. Anyone using this Firefox session can view codes until you lock it or quit Firefox.
- Clipboard access is write-only and happens when you click a code. The copied code stays in the system clipboard until you replace it; the extension does not read the clipboard or clear other clipboard content.
- Supported: TOTP with SHA-1, SHA-256, or SHA-512, custom digits and periods, Aegis file version 1 / database versions 1–3. Other token types (HOTP, Steam, MOTP, Yandex) and invalid entries are skipped with visible details. Imported icons are ignored; service initials are shown.
- Aegis encrypted imports require a password slot. Android biometric-only slots cannot be unlocked in Firefox. Imports are limited to 20 MB and 10,000 entries; scrypt parameters are bounded to avoid excessive memory/CPU usage from malformed files.
- Codes depend on your system time. Keep the computer clock synchronized.

## Develop and verify

Requires Node.js 22.14+ and Python 3 (for packaging and the Firefox smoke test).

```sh
npm ci
npm run typecheck
npm run build
npm test
npm run lint
npm run test:firefox
npm run package
```

`npm test` checks all 18 RFC 6238 reference vectors, period boundaries, malformed inputs, group compatibility, password/tamper rejection, local encryption, session cache lifetime and revision matching, and interoperability with Aegis's own encrypted sample and Node's cryptography. `npm run lint` uses Mozilla's Add-ons Linter and fails on errors and unexpected warnings. `scripts/lint.mjs` allows only the exact `innerHTML` statement inside Vue's static-template renderer: it inserts trusted HTML produced by the Vue compiler, never imported vault data. Mozilla's raw linter still reports that library warning. Account data uses escaped interpolation; do not introduce `v-html`.

`npm run test:firefox` launches a disposable headless Firefox profile using its built-in Marionette protocol. It exercises real extension installation, plaintext/encrypted imports, password retries, failed replacement recovery, code rollover, copy, group/search filtering, session unlock across closed/reloaded views, manual locking across tabs, password re-entry after a real browser process restart, and removal. The disposable test archive has a controllable clock injected for rollover and inactivity tests; this hook is never included in the shipped extension. It never opens the user's Firefox profile. A screenshot using public demo secrets is written to `artifacts/preview.png`.

`npm run package` produces `artifacts/firefox-aegis-1.1.0.zip`. Runtime dependencies are bundled in `extension/app.js`; no network or package installation is needed to run the extension. Edit `src/`, then rebuild. Files in `extension/` named `app.html`, `app.css`, and `app.js` are generated; the manifest and icons remain maintained directly there.

The UI uses Vue 3 single-file components with TypeScript and Vite. `src/App.vue` owns the import/unlock screens and shared session state; `src/components/AccountCard.vue` renders each account and its countdown. A shared clock drives code updates, and account components discard pending results after unmounting. `src/vault.ts`, `src/totp.ts`, and `src/session.ts` contain framework-independent application logic, with shared models in `src/types.ts`. `npm run typecheck` checks TypeScript and Vue templates and runs before every production build. Unit tests execute the TypeScript modules directly using Node's type stripping. Vue templates are compiled during the build, so the extension needs no runtime compiler or relaxed content security policy.

## Format and test sources

- [Aegis vault format and encryption design](https://github.com/beemdevelopment/Aegis/blob/master/docs/vault.md).
- [Aegis decryption reference](https://github.com/beemdevelopment/Aegis/blob/master/docs/decrypt.py).
- `tests/fixtures/upstream-plain.json` and `upstream-encrypted.json` are public test fixtures from [Aegis's importer tests](https://github.com/beemdevelopment/Aegis/tree/master/app/src/test/resources/com/beemdevelopment/aegis/importers), distributed under Aegis's GPL-3.0 license (see `tests/fixtures/LICENSE`). Their documented test password is `test`.
- `tests/fixtures/demo.json` contains public demo secrets, not real accounts. **Never use these secrets to protect an account.**
- [RFC 6238 Appendix B](https://www.rfc-editor.org/rfc/rfc6238#appendix-B).
- Bundled scrypt comes from `@noble/hashes`. Its MIT license and the bundled Vue packages’ MIT licenses are included in `extension/THIRD_PARTY_LICENSE.txt`.

Independent project; not affiliated with the Aegis or Firefox teams.
