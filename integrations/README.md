# Plugin collaboration / 插件协作

The first example is [Obsidian Selection](obsidian-selection/README.md): explicitly selected text is sent through the trusted local CLI's stdin, and success requires a matching persistence receipt. It contains only an independent external adapter, not Jotra product implementation.

It has passed real CLI/App and Obsidian desktop GUI checks in an isolated developer-preview environment. **A compatible preview App and CLI must be supplied separately; there is no public binary release here.** Read [setup and recovery](../docs/local-tools.md), [validation limits](../docs/validation.md), and [integration status](../PLUGINS.md).

For AI tool clients, see the separately verified [Codex local MCP connection](../docs/mcp-codex.md). It exposes creation and own-receipt lookup only; it is not an Obsidian dependency.

Use an [integration proposal](https://github.com/taokuntao-a11y/jotra-community/issues/new?template=integration.yml) to discuss another tool or workflow. Start from the [proposal template](proposals/TEMPLATE.md). Include author/rights information, installation and removal, exact supported versions, permissions and data flow, and real persistence, retry, revocation, and failure tests. Label experimental work accurately.

Product source, credentials, private notes, and direct database access do not belong in submissions. Community maintenance does not imply official product support. Other external adapters must state their own rights and licensing; the included example follows [RIGHTS.md](../RIGHTS.md).

首个示例已跑通，可阅读代码并在独立预览环境验证。其他接入先提交提案，明确版本、权限、维护范围与验收证据；产品源码继续保持私有。
