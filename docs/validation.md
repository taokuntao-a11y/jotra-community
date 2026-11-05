# Preview compatibility and validation

Updated 2026-11-05. These results describe isolated developer-preview tests with fictional content. They are not a promise of general availability or App Store compatibility.

| Component | Verified environment | Result and limits |
| --- | --- | --- |
| Jotra local-write protocol | v1, isolated signed App Sandbox preview, macOS 27.0 arm64 | Real authenticated HTTPS creation, same-ID replay, own-receipt lookup, and App management checks. Product implementation stays private. |
| Jotra CLI | 0.1.0 developer preview, macOS 27.0 arm64 | Real App persistence, replay, receipt lookup, validation, unavailable/authorization/conflict cases. macOS 14+ is a build target; macOS 14 and x86_64 runtime remain unverified. |
| Local MCP adapter | 0.1.0 preview, official TypeScript SDK 2.4.0, Node 26.7.0 | stdio adapter delegates creation/own-receipt operations to the trusted CLI with `--no-launch`; no product source is included here. Node ≥20 is the package requirement, not an all-version runtime test. |
| Actual Codex MCP client | Codex CLI 0.162.1, MCP 2025-06-18, macOS 27.0 arm64 | Ephemeral app-server discovery and direct tool calls → real CLI → isolated App: persisted save, same-ID replay, receipt lookup, changed-input conflict, and missing-receipt unknown state. No model turn or persistent configuration changes. |
| Independent MCP protocol tests | Official SDK 2.4.0; pinned MCP 2026-07-28 and legacy mode | Discovery, strict schema, tool calls, and process lifecycle checks. Separate SDK coverage does not establish that Codex negotiated 2026-07-28. |
| Obsidian Selection example | 0.1.0; Obsidian 1.13.7 desktop, official Sandbox, macOS 27.0 arm64 | Actual plugin load, settings, editor selection command → real CLI → persisted receipt, then actual receipt-query command. The QA App GUI confirmed only the selected paragraph and `#Obsidian` tag, without the unselected sentinel. The daily vault was not used. |
| Adapter regression suite | Node 26.7.0 test runner, 15 dependency-free checks | Real subprocess stdin, paths with spaces, literal shell characters, strict receipt validation, timeout/output limits, duplicate click protection, unknown-state recovery, minimal metadata, and environment filtering. |
| Adapter live harness | Real CLI and isolated preview App, 7 checks | Registered editor-command handler, persisted receipt, stable replay, lookup, metadata reload, no selected-text storage, unconfigured authorization rejection. The harness alone is not an Obsidian GUI test; the separate GUI run above supplies that evidence. |

**Pending:** replaying the actual Codex/MCP request after restarting the isolated Jotra App has not yet been verified. MCP end-to-end acceptance is therefore not fully complete. There is also no general binary release, notarization claim, or App Store integration claim.

The example manifest's minimum Obsidian version is an API floor, not evidence that every intervening version was tested. Mobile Obsidian, Windows/Linux, older macOS versions, x86_64, and arbitrary MCP clients are not covered by these results.

## Reproduce

Run the example's dependency-free checks from `integrations/obsidian-selection`:

```sh
npm test
```

The live harness writes a fictional note and therefore requires deliberate opt-in, an authorized isolated test profile, and an evidence path outside the repository:

```sh
node test/live-cli.cjs --cli /absolute/path/to/jotra --profile test_obsidian --evidence /absolute/private/test-result.json --allow-fictional-write
```

For GUI verification, follow the [example instructions](../integrations/obsidian-selection/README.md) in an independent test vault. Put one fictional paragraph above an unselected sentinel paragraph; select only the first, run **Save selection to Jotra**, then **Check last Jotra write receipt**. Require a matching persisted receipt and inspect the created note in the preview App. Never use real private notes as public test fixtures.

Do not upload authorization exports, Keychain data, real note content, internal build paths, or private implementation logs as compatibility evidence. Public reports should identify versions, platform, outcome, and sanitized failure conditions.
