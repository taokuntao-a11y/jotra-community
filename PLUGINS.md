# Integration status / 插件接入状态

Updated: 2026-11-05. **Developer preview; local CLI / MCP writing is not yet released.** Product source code remains private.

## Intended first interface

The first planned integration is free, explicitly authorized local creation of notes on macOS. CLI, local MCP, and external adapters are intended to share the same supported interface and validation rules. A durable save receipt must confirm persistence before a tool reports success. Data synchronization remains a separate planned paid capability.

No released local endpoint, executable download, SDK, or supported plugin installation process is provided here. Private candidate contracts are still being validated. Remote relay/MCP code is not evidence of a production-ready service.

## Propose an adapter

Use the integration issue template and describe:

- The user workflow and source tool, supported systems, and example input using fictional content.
- Whether it only creates notes or also needs read/search/update/delete access. Those additional capabilities have not been approved for the initial interface.
- How the user grants and revokes access, how retries avoid duplication, and how success is verified.
- What is sent to remote services, where credentials live, and who maintains the adapter.

Do not access private app files, write SQLite directly, use internal App Group storage, embed shared credentials, or execute a note as a command. App-private implementation details are not an integration contract.

## Future verification

An integration can be listed as supported only after a released API exists and its exact app/tool/protocol versions, authorization, real save receipt, offline/failure/retry behavior, and revocation have been tested. Community proposals are experimental until then.

The roadmap may later consider separately authorized reading or search. No permission to read existing notes is implied by permission to create notes.

中文说明：现在可提交接入需求，尚不能安装或调用本机 CLI/MCP。首批规划是免费、授权后的本机写入；读取、搜索、修改、删除另行评估。开发者文档不会把 URL 打开成功或远程 queued 状态当成本机保存完成。
