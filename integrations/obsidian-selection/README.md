# Obsidian → Jotra：选中文字示例

这是独立的外围适配器：只读取你主动选中的文本，通过 Jotra CLI 的 stdin 保存，并核对持久化回执。没有 App、Core、CLI、MCP 或 relay 的产品实现，不直接访问 Jotra 的数据库或私有目录。

**开发预览，已完成真实 CLI 与 Obsidian GUI 联调；尚非通用正式发布。** 需要单独取得兼容的 Jotra 预览 App 与 CLI。已提交商店的本机笔记首版不等同于开放接口预览。授权和命令格式见 [本机工具说明](../../docs/local-tools.md)。

## 安装到测试库

1. 先用 Jotra 的本机工具界面为 Obsidian 创建具名授权，再用可信 CLI 的 `auth import --profile obsidian` 导入。配对材料由 CLI 隐藏输入，不能放进本插件或仓库。
2. 在独立的 Obsidian 测试库中创建 `.obsidian/plugins/jotra-selection/`，只复制本目录的 `manifest.json` 和 `main.js`。无需 npm 安装或构建。
3. 在该测试库的 Community plugins 中启用 **Jotra Selection (Preview)**。
4. 在插件设置中填入可信 Jotra CLI 的绝对路径和刚导入的 profile 名。路径可以包含空格，不要填 shell 命令或附加参数。
5. 先启动 Jotra 预览 App 并开启本机工具。插件固定使用 `--no-launch`，不会自动启动或授权 App。
6. 打开虚构 Markdown 笔记并选中一段文字，运行命令 **Jotra Selection (Preview): Save selection to Jotra**。只有 CLI exit 0 且回执为 `persisted`，才会显示本机保存成功。

## 数据与授权

- 只发送主动选中的文本，加上固定 `Obsidian` 标签和固定来源标题；不遍历库，不发送文件名、未选中的正文或整个文件。
- 正文只经 stdin；参数数组、`shell: false`，正文里的引号、换行和 `$()` 都是数据。
- 插件配置只保存 CLI 路径、profile 名和最小请求／回执元数据，不保存正文或任何配对凭证。
- 本插件没有访问笔记列表、读取、搜索、修改、删除或导出的能力。查询的是自己已提交请求的历史回执，不是笔记内容。
- 环境变量只传递 PATH、HOME、TMPDIR 和语言设置，不把模型 API 密钥或配对导出传给 CLI。没有外部网络请求或遥测。

## 未知结果与恢复

超时、退出或响应异常可能发生在保存之后。插件保留原 requestId，阻止换新 ID 再发，提供 **Check last Jotra write receipt** 命令。

回执未找到不证明此前没有保存。不要在未决请求期间替换原授权、改用另一个 profile 或用新 ID 重发。如果授权已被撤销，在 Jotra 的本机工具管理界面按原授权／requestId 人工核对；没有自动撤销、删除笔记或自动清空未知状态的功能。

单独的新“保存所选文字”操作会创建新 ID。相同文字由用户有意保存两次也会产生两条笔记；幂等只针对同一次逻辑请求的相同 ID、内容和授权。

## 测试

`node --test test/*.test.cjs`：15 项无依赖测试，覆盖真实子进程 stdin、空格路径、字面 shell 字符、回执校验、超时、输出上限、重复点击、未知结果、敏感环境过滤及最小元数据。

`test/live-cli.cjs` 是显式写入的联调脚本，必须指定可信 CLI、隔离测试 profile、证据输出路径以及 `--allow-fictional-write`。它只写虚构内容，通过真实 CLI／HTTPS 核对回执与同 ID 重放，不读 Jotra 数据库。该脚本的 Obsidian 命令适配器使用测试宿主，不把它单独算成 Obsidian GUI 验收。

2026-11-05 已在 macOS 27.0 arm64、Obsidian 1.13.7 官方 Sandbox 中实际加载插件，选中虚构段落，通过真实 Jotra CLI 0.1.0 预览版保存，并用实际 **Check last Jotra write receipt** 命令核对同一请求的 `persisted` 回执。另有 7 项真实 CLI 联调检查和 15 项回归检查。完整范围见 [兼容矩阵](../../docs/validation.md)；最低版本声明不是全版本实测。

## 停用

在测试库停用本插件即可停止新调用；取消正在进行的调用不能撤销已提交的笔记。在 Jotra 中撤销该具名授权，再用 CLI 忘记对应 profile。不要把删除插件当作撤销授权或删除笔记。

本示例沿用协作仓库的版权保留规则，未授予产品源码的开源许可。它不是 Obsidian 官方插件，也未提交 Obsidian 插件目录。

参考：[Obsidian 官方插件开发说明](https://docs.obsidian.md/Plugins/Getting%20started/Build%20a%20plugin)、[官方示例中的编辑器命令](https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/src/main.ts)。
