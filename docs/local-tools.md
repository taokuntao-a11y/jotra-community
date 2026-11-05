# Local tools developer preview / 本机工具开发预览

Updated 2026-11-05. **This is a validated developer preview, not a public binary release.** You need a separately supplied compatible Jotra preview App and trusted CLI. The previously submitted App Store build does not acquire these features from installing an adapter. Product source code remains private.

本机写入免费，不依赖同步订阅、云账号或远程 relay。目前验证环境见 [兼容与验收记录](validation.md)。没有通用下载包；请先通过 [接入 Issue](https://github.com/taokuntao-a11y/jotra-community/issues/new?template=integration.yml) 说明测试场景，不要公开配对材料。

## 1. Authorize one tool / 为工具单独授权

1. Start the compatible preview App. Open **Settings → Local tools / 设置 → 本机工具**, enable the local service, and create a named authorization for this tool.
2. Use the trusted CLI's absolute path. Import the one-time pairing material through its hidden terminal prompt:

```sh
/absolute/path/to/jotra auth import --profile obsidian
```

Do not place pairing material in arguments, environment variables, MCP configuration, plugin settings, screenshots, issues, or repositories. The CLI stores the credential in its own macOS Keychain and non-secret profile metadata in its own client directory. An adapter receives only the executable path and local profile name.

Use separate authorizations and profiles for Obsidian and an MCP client. A profile name selects a previously imported authorization; creating a new name does not authorize it. Replacing an existing profile is an explicit operation and must wait until pending requests under that authorization have been resolved.

```sh
/absolute/path/to/jotra version --json
/absolute/path/to/jotra doctor --profile obsidian --json
```

`doctor` is read-only and never launches the App. A failed dependent check may be `not_checked`; this is not a successful check. It does not reveal a token, pin, local port, note content, or user paths.

## 2. Save fictional content / 用虚构内容试写

Generate a fresh UUID v4 for a new logical save and retain it before invoking the tool. The UUID below is illustrative; replace it for each new operation. Keep the same ID, exact input, and original authorization for retries.

```sh
/absolute/path/to/jotra add --stdin-json --json --no-launch --profile obsidian <<'JSON'
{"protocolVersion":1,"requestId":"33333333-3333-4333-8333-333333333333","text":"Fictional example: sort the bookshelf.","tags":["Example"],"title":"Example workflow","url":""}
JSON
```

Use a parameter array with `shell: false` and write JSON to stdin when building an adapter. Never interpolate selected text into a shell command. Plugin and MCP examples use `--no-launch`: the user starts and enables Jotra explicitly.

A successful response has this shape:

```json
{"protocolVersion":1,"receipt":{"requestId":"33333333-3333-4333-8333-333333333333","status":"persisted","sparkId":"44444444-4444-4444-8444-444444444444","persistedAt":"2026-11-05T10:00:00.000Z"},"replayed":false}
```

Only exit code 0 and a matching `persisted` receipt confirm a completed local save. Launching the App, accepting a URL, or obtaining a remote `queued` response does not confirm persistence.

## 3. Verify and retry safely / 核对和重试

```sh
/absolute/path/to/jotra receipt 33333333-3333-4333-8333-333333333333 --json --no-launch --profile obsidian
```

- A timeout, cancellation, lost connection, or missing receipt can leave the result **unknown**. Keep the original request ID. Query its receipt; if retrying creation, keep the same ID, exact content, and original profile/authorization.
- Replaying the same ID and input returns the original receipt with `replayed: true`. Changed input under the same ID is a conflict. New IDs intentionally create new notes, even for identical text.
- A later failed attempt does not erase an earlier unknown delivery. `not_committed` describes that attempt only; it does not prove that no earlier or concurrent attempt committed.
- Do not replace the authorization or send with a new ID while the old result is unresolved. If the original authorization is revoked or inaccessible, use Jotra's first-party local-tools management view to check the historical request ID.
- A receipt proves a historical save. It does not read the note or prove that the user has not subsequently deleted it. A retry does not recreate a deleted note.

The [Obsidian example](../integrations/obsidian-selection/README.md) conservatively blocks new saves while a request is unknown and provides a receipt-query command. It does not retain the selected text for automatic resubmission.

## Input and access boundaries

The v1 JSON object accepts `protocolVersion: 1`, required UUID v4 `requestId` and nonblank `text`, plus optional `tags`, `title`, and `url`. The App is authoritative for validation: request ≤262,144 UTF-8 bytes, final composed body including appended tags ≤20,000 characters, ≤10 tags of ≤50 characters, title ≤500 characters, and an absolute HTTP(S) URL ≤2,048 UTF-8 bytes. Swift `Character` counts are not JavaScript UTF-16 lengths; do not silently truncate. Tags follow Jotra's existing tag syntax.

The grant permits creation and retrieval of its own historical write receipts. It does not grant note listing, reading, search, editing, deletion, export, database access, or remote access. The CLI uses authenticated, certificate-pinned HTTPS on the paired loopback endpoint. Do not bypass this with SQLite, App Group files, an Inbox directory, URL schemes, or a remote relay.

CLI exit codes: `0` success; `2` input/protocol error; `3` unavailable; `4` profile/identity/authorization error; `5` conflict; `6` unknown delivery or missing receipt; `7` confirmed storage rollback; `8` busy. Parse structured error codes and commit state, not localized messages or stderr.

Preview exception: the frozen CLI maps `FORBIDDEN` to exit `2`. Treat the structured error code and commit state as authoritative rather than assuming every authorization error has exit `4`.

## Stop access / 停用

Disable the adapter to stop new calls. Revoke its named authorization inside Jotra to invalidate all copies of that credential. Then remove the local client profile:

```sh
/absolute/path/to/jotra auth forget --profile obsidian
```

Forgetting a local profile is not server-side revocation. Neither disabling a plugin nor cancelling a request deletes a note that has already committed.
