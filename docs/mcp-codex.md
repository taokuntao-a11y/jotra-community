# Codex MCP connection / Codex 的本机 MCP 接入

**Developer preview: actual Codex tool calls passed; App-restart replay verification is pending.** A compatible Jotra preview App, trusted CLI, and separately supplied local MCP package are required. This repository publishes the integration instructions and an external Obsidian adapter; it does not publish the Jotra CLI/MCP implementation or a general binary download.

## Prepare a separate authorization

Start the compatible App and create a named authorization in **Settings → Local tools**. Import it through the trusted CLI's hidden terminal prompt:

```sh
/absolute/path/to/jotra auth import --profile codex
/absolute/path/to/jotra doctor --profile codex --json
```

Use [the CLI guide](local-tools.md) for authorization, error states, and revocation. Do not reuse an unresolved plugin operation under a different profile. The MCP process receives a CLI path and profile name; no pairing material belongs in MCP configuration or a model prompt.

## Reviewable Codex configuration

This is an example to adapt to your separately supplied preview package. Replace all absolute paths. The Node executable launches the package's compiled entry point with its dependencies available; it does not download or build product source from this repository.

```toml
[mcp_servers.jotra]
command = "/absolute/path/to/node"
args = ["/absolute/path/to/jotra-local/dist/index.js", "--cli", "/absolute/path/to/jotra", "--profile", "codex"]
startup_timeout_sec = 10
tool_timeout_sec = 45
enabled_tools = ["create_spark", "get_write_receipt"]
```

The configuration contains no token, endpoint, certificate pin, App-private path, or remote service. The adapter uses stdio MCP and invokes the configured CLI with `--no-launch`; start Jotra and enable its local service first. It cannot open an authorization prompt or grant itself access. The preview package requires Node 20 or later; the actual test runtime was Node 26.7.0.

Codex configuration fields are described in the [official OpenAI MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli). The validation process does not alter a user's existing Codex configuration. Apply this example only to the client/profile you intend to configure, and follow its tool approval settings.

## Two tools, one saved request ID

`create_spark` takes a required client-generated UUID v4 `requestId`, required `text`, and optional `tags`, `title`, and `url`. Persist the ID before calling. For a new operation, generate a fresh ID rather than copying the illustrative ID below:

```json
{"requestId":"33333333-3333-4333-8333-333333333333","text":"Fictional example: sort the bookshelf.","tags":["Example"],"title":"Codex example","url":""}
```

`get_write_receipt` takes only the original ID:

```json
{"requestId":"33333333-3333-4333-8333-333333333333"}
```

Successful structured output preserves the v1 local-write envelope, matching receipt, and creation replay flag. Only `receipt.status: persisted` confirms local persistence. Business errors use `isError: true` and structured error details; a tool response by itself does not prove that a note was saved.

After an unknown result, query the original ID or retry identical input with the same ID and original authorization. Do not let a model silently invent a replacement ID. A missing receipt is inconclusive; cancellation does not undo a committed note. These rules also apply across client/server restarts. The `idempotentHint` applies only to identical ID, content, and authorization.

Receipt lookup returns historical save metadata, not note content or current note state. The adapter exposes no reading, search, update, deletion, export, arbitrary shell execution, or remote relay tools. It never scans Jotra's private files.

## Validation and removal

Codex CLI 0.162.1's actual app-server MCP client passed discovery, creation, identical replay, receipt lookup, content-conflict, and missing-receipt checks against the real CLI and isolated App. It negotiated MCP **2025-06-18**. The locked official TypeScript SDK is **2.4.0**; a separate SDK protocol test covered **2026-07-28**. The latter is not a claim that this Codex version negotiated that revision.

Check [the validation matrix](validation.md) for the full scope. The Codex run used an isolated ephemeral app-server session and direct experimental `mcpServer/tool/call`, with no model turn and no persistent client configuration change. This establishes actual Codex transport/tool invocation, not model planning or automatic tool selection. Other desktop MCP clients remain unverified.

Disable/remove the MCP server entry to stop new calls. Revoke its authorization in Jotra, then use `jotra auth forget --profile codex` to remove the local profile. Removing a client entry alone does not revoke another copy of its authorization or delete notes already saved.
