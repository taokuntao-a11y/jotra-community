# 寸念 / Jotra 社区协作

[English](README.en.md) · [官网](https://jotra.henkeyi.com/)

这里用于反馈问题、改进翻译和协作外围工具接入。**寸念产品源码保持私有。**

[提交反馈或翻译建议](https://github.com/taokuntao-a11y/jotra-community/issues/new/choose) · [插件协作](integrations/README.md) · [贡献指南](CONTRIBUTING.md) · [讨论交流](https://github.com/taokuntao-a11y/jotra-community/discussions)

官网只提供产品介绍、帮助、隐私及开发文档，并外链到确认后的 GitHub 项目；不在官网内建设社区、讨论区或托管插件代码。后续话题或社媒频道也通过外链进入。

## 如何参与

- 问题与建议：使用对应 Issue 模板，提供版本、预期结果和虚构数据的复现步骤。
- 翻译：阅读 [翻译指南](TRANSLATING.md)，修改 `translations/<语言>.json`，提交小范围 PR。
- 插件与工作流：先提交接入提案，说明用户场景、输入、权限与数据流，参阅 [插件接入状态](PLUGINS.md)。
- 文档：更正使用说明和接入提案；公开协作不包含产品源码。

## 当前接入状态

macOS 首版是本机笔记应用。免费本机 CLI、Codex MCP 接入与首个 Obsidian 选中文字示例已完成隔离环境联调，处于开发者预览，尚无公开 App / CLI / MCP 下载包。已提交商店的版本不等同于接口预览。

2026-11-06 已通过寸念测试 App 重启后的 MCP 原请求重放与回执复验：Spark ID、保存时间保持一致，界面核对仍为唯一一条记录，详见实测记录。

[CLI 授权、写入与回执](docs/local-tools.md) · [Codex MCP 配置](docs/mcp-codex.md) · [Obsidian 插件示例](integrations/obsidian-selection/README.md) · [实测版本与限制](docs/validation.md)

参与翻译、反馈和外围集成，不需要访问应用实现。当前外围示例已说明版本、权限和版权范围；后续 SDK 或其他适配器也会分别说明。

## 反馈与隐私

请不要在公开 Issue / PR 中放真实笔记、数据库、密钥、配对材料或私人联系方式。敏感问题请联系 [hello@go2come.com](mailto:hello@go2come.com)。没有 GitHub 账号也可以通过邮件反馈。

本仓库公开文档、翻译资源、协作配置和独立外围插件示例，未包含 App、Core、CLI、MCP 或中转服务的产品实现。目前未添加通用开源许可证，版权说明见 [RIGHTS.md](RIGHTS.md)。

本地检查：`python3 .github/scripts/validate_translations.py`；插件检查：在 `integrations/obsidian-selection` 运行 `npm test`。Pull Request 会自动检查翻译与插件示例。
