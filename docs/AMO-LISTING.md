# Mozilla Add-ons listing materials

## Listing fields

**Name:** Aegis Viewer

**Summary:** View TOTP codes locally from your Aegis Authenticator exports. Unofficial, with no uploads or sync.

**Suggested category:** Privacy & Security

**License:** MIT (bundled third-party components keep their respective licenses).

**Platforms:** Desktop Firefox on Linux, Windows, and macOS. The release browser
test runs on Linux. Android has not been tested and should not be selected.

**Suggested screenshots:** `artifacts/preview-light.png`,
`artifacts/preview-dark.png`, and `artifacts/showoff.png` in the project checkout.
They use public demo accounts.

## Description

View your Aegis Authenticator verification codes in Firefox. Import an Aegis JSON
export and generate time-based one-time passwords entirely on your device.

- Open encrypted or unencrypted Aegis exports.
- Optionally encrypt the saved local copy of an unencrypted export.
- Search accounts, filter by Aegis groups, and click a code to copy it.
- Use the toolbar popup or open the viewer in a tab.
- Lock password-protected vaults manually, after a timeout, or on browser restart.
- Choose light or dark mode, color presets, or a custom background.

No account, servers, uploads, analytics, or synchronization. The saved vault stays
in your Firefox profile. Unencrypted imports open without a password and do not
support locking. Encrypted exports are recommended.

Imports are snapshots: export and import a new file when your Android vault
changes. A successful import replaces the saved vault; the original file stays
unchanged. Only TOTP entries are supported (SHA-1, SHA-256, SHA-512). Other token
types and invalid entries are skipped, with details available in Settings.
Your computer's clock must be accurate.

Requires Firefox 142 or later. This is an unofficial third-party extension,
not affiliated with or endorsed by the Aegis Authenticator or Firefox teams.
This extension was made entirely by AI.

## Privacy statement

Aegis Viewer does not collect or transmit user data. File reading, decryption,
password derivation, and code generation happen locally. There are no analytics,
remote fonts, remote scripts, content scripts, or website permissions. Its content
security policy blocks network connections.

The selected export is copied into Firefox's local extension storage, alongside
appearance and lock preferences. Encrypted exports retain their encryption.
When an unencrypted export is imported with local encryption, the saved copy is
encrypted using AES-256-GCM and PBKDF2-HMAC-SHA-256 with 600,000 iterations and
random salt/IV. Importing without a password saves plaintext in the Firefox
profile and disables locking for that vault. Passwords are not saved or cached.

Unlocked password-protected accounts are cached in Firefox's in-memory session
storage, which is cleared on lock, timeout, browser restart, add-on reload, or
removal of the saved vault. JavaScript cannot guarantee immediate physical erasure
of memory. Browser extension views communicate only with their own background page
to coordinate session changes.

Clicking a code writes it to the system clipboard. The extension does not read the
clipboard or automatically clear the copied code. Removing the vault deletes the
extension's saved copy and session cache, while keeping appearance/lock preferences.
It does not delete the original export or backups.

## Reviewer notes

This is a local-only viewer. No login, paid features, remote services, native
messaging, or external credentials are needed. Upload the matching source ZIP;
build instructions and exact release tool versions are in `docs/BUILDING.md`.

For functional testing, use the public fixture
`tests/fixtures/demo-encrypted.json` from the source archive with password `demo`.
All fixture secrets are public and must never protect real accounts.

1. Open the toolbar popup and choose **Choose Aegis JSON**, which opens a tab.
2. Choose the demo file, enter `demo`, and select **Continue**.
3. Verify 24 demo accounts, group filters, searching, code countdowns, and copying.
4. Open another extension view, select **Lock**, and verify both views require
   the password. Reopening a view must preserve the locked state.
5. Unlock, choose **Settings → Lock settings → After 1 minute**, close all
   extension views, and wait over a minute. Reopening must require the password.
6. Restart Firefox with the signed add-on installed; the password is required.
   A temporary add-on must be loaded again after restarting Firefox.
7. Try `tests/fixtures/demo.json` for the unencrypted import flow. Verify both
   **Encrypt local copy** and **Import without password**. The latter saves
   plaintext and has no lock controls; the interface and documentation explain it.
8. **Remove vault** deletes the saved copy and returns to the welcome screen.

The Mozilla linter's single `UNSAFE_VAR_ASSIGNMENT` warning is Vue's bundled
static-template renderer. It inserts compiler-generated static markup. Imported
account names and group names use escaped interpolation, never `v-html`.
See `scripts/lint.mjs` for the exact, narrowly scoped warning allowance.

Permissions:

| Permission | Purpose |
| --- | --- |
| `storage` | Save the local vault/preferences and hold the unlocked session in memory. |
| `clipboardWrite` | Copy a current code when the user clicks it. |
| `alarms` | Expire a timed unlock even when all extension views are closed. |

The manifest declares `data_collection_permissions.required: ["none"]`.
No browsing history or website access is requested.

## Version 1.1.1 release notes

Fixed a concurrency issue where opening another view during locking could restore
the unlocked session. Session renewal, unlocking, manual locking, and automatic
expiry now share one background queue. Added concurrency regression tests and
matching source packages with reproducible build instructions.

## Submission steps

Run the checks in `docs/BUILDING.md` and create both ZIPs with `npm run package`.
At the [AMO Developer Hub](https://addons.mozilla.org/developers/), upload the
runtime ZIP, then attach the matching `-sources.zip` as source code. Use the text
above for the listing and reviewer notes. For an existing listing, upload as a new
version of that listing. Do not create a second listing for an update.

The add-on ID remains `firefox-aegis@local.extension` so existing installations can
receive updates. Regular Firefox requires Mozilla signing. The generated ZIPs are
unsigned; building them does not submit, sign, or publish the extension.

References: [Source submission](https://extensionworkshop.com/documentation/publish/source-code-submission/)
and [Submitting an add-on](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).
