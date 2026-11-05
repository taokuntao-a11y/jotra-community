# Integration status / 插件接入状态

Updated: 2026-11-05. **Developer preview; see passed and pending checks in the validation matrix. No public App / CLI binary release.** Product source code remains private.

## Start here

- [CLI authorization, local writing, receipts, and recovery](docs/local-tools.md)
- [Codex MCP setup and tested protocol versions](docs/mcp-codex.md)
- [First independent example: Obsidian selected text → Jotra](integrations/obsidian-selection/README.md)
- [Exact tested versions, outcomes, and limitations](docs/validation.md)

The first interface permits free, explicitly authorized local creation on macOS. A durable `persisted` receipt must confirm a save before a tool reports success. Data synchronization is separate. A submitted App Store package, remote relay, or URL handler is not a substitute for the compatible local-tools preview.

The Obsidian example has passed actual desktop GUI → CLI → isolated App persistence and receipt-query checks. It is a developer example, not a marketplace listing or a claim that all Obsidian/macOS versions are supported. Public source in that example is solely the external adapter; App, Core, CLI, MCP, and relay implementation remain private.

## Propose an adapter

Use the [integration issue template](https://github.com/taokuntao-a11y/jotra-community/issues/new?template=integration.yml) and describe:

- The user workflow, source tool, exact tested versions, platforms, and fictional input.
- What is sent, where credentials live, and who maintains the adapter.
- How the user grants and revokes access, preserves request IDs through failures, and verifies persistence.
- Whether the workflow needs more than note creation and own-receipt lookup. Reading, search, update, deletion, and export have not been granted by this first interface.
- Setup/removal instructions, author and rights information, tests, and a clear preview/released status.

Do not access private app files, write SQLite directly, use internal App Group storage, embed shared credentials, or execute a note as a command. App-private implementation details are not an integration contract.

An integration is listed as released only after a compatible public release exists and its authorization, actual save, retry, failure, and revocation behavior have been verified. Community maintenance does not imply official product support. Permission to create never implies permission to read existing notes.

中文说明：首个 Obsidian 外围示例已在隔离预览环境跑通。需另行取得兼容预览 App 与 CLI；本仓库没有正式下载包或插件市场。请从上方文档开始，用虚构内容测试，公开反馈不要附带笔记或配对材料。
