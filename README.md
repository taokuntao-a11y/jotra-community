# 寸念 / Jotra 社区协作

[English](README.en.md) · [官网](https://jotra.henkeyi.com/)

这里用于反馈问题、改进翻译和协作外围工具接入。**寸念产品源码保持私有。**

[提交反馈或翻译建议](https://github.com/taokuntao-a11y/jotra-community/issues/new/choose) · [插件协作](integrations/README.md) · [贡献指南](CONTRIBUTING.md)

官网只提供产品介绍、帮助、隐私及开发文档，并外链到确认后的 GitHub 项目；不在官网内建设社区、讨论区或托管插件代码。后续话题或社媒频道也通过外链进入。

## 如何参与

- 问题与建议：使用对应 Issue 模板，提供版本、预期结果和虚构数据的复现步骤。
- 翻译：阅读 [翻译指南](TRANSLATING.md)，修改 `translations/<语言>.json`，提交小范围 PR。
- 插件与工作流：先提交接入提案，说明用户场景、输入、权限与数据流，参阅 [插件接入状态](PLUGINS.md)。
- 文档：更正使用说明和接入提案；公开协作不包含产品源码。

## 当前接入状态

macOS 首版是本机笔记应用。免费本机 CLI / MCP 写入仍在设计与验证，尚未发布。这里的接入讨论不是可调用的 API、SDK 或插件安装市场。

产品代码公开范围与社区反馈渠道是两件事：参与翻译、反馈和外围集成，不需要访问应用实现。未来如发布插件 SDK、适配器或示例，会分别说明版本、权限与许可证。

## 反馈与隐私

请不要在公开 Issue / PR 中放真实笔记、数据库、密钥、配对材料或私人联系方式。敏感问题请联系 [hello@go2come.com](mailto:hello@go2come.com)。没有 GitHub 账号也可以通过邮件反馈。

本仓库公开文档、翻译资源和协作配置，未包含 App、Core、CLI、MCP 或中转服务的产品实现。文档与译文暂未添加通用开源许可证，版权说明见 [RIGHTS.md](RIGHTS.md)。

本地检查：`python3 .github/scripts/validate_translations.py`。Pull Request 会自动检查翻译结构、占位符、链接与章节标识。
