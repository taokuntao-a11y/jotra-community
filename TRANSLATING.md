# Translation guide / 翻译指南

Jotra currently prepares 15 languages: English, Simplified Chinese, Traditional Chinese, Japanese, Korean, French, German, Spanish, Brazilian Portuguese, Italian, Russian, Arabic, Hindi, Indonesian, and Vietnamese.

`translations/en.json` is the reference. Each language uses the same keys under `catalogs`, `website`, `safari`, and `chrome`. These are copy resources; the product source code is not included.

1. Choose one language and describe the intended correction in an issue or PR.
2. Change translated values, preserving all keys and array order. Website section IDs identify anchors and must remain unchanged.
3. Preserve `%lld`, `%@`, `${applicationName}`, and Chrome `$PLACEHOLDER$` tokens and their metadata exactly. Preserve HTML tags and link destinations. Keep real newline characters in JSON strings as JSON `\n`, not double-escaped `\\n`.
4. Keep `Jotra`, `Spark`, `Safari`, `MCP`, and other product/protocol identifiers recognizable. Translate general prose naturally. Use the platform's actual localized names for settings and system features.
5. Do not change release scope, prices, data-handling claims, retention periods, or whether a feature is shipped through a translation PR. Propose any intended product/documentation change separately.
6. Test long text and, for Arabic, right-to-left layout where you have access to a build. Say what you checked and what you could not check; native-speaker review is welcome.

The maintainer validates key coverage, placeholders, anchors, and links, then imports reviewed resources into private product repositories. Community assets are not automatically deployed or released.

Run `python3 .github/scripts/validate_translations.py` before submitting. The same check runs automatically on pull requests. Include any limitations, such as not having tested a particular device or not being a native speaker, in the PR description.

中文说明：只修改译文，不改键名、占位符、链接及章节 ID；不要借翻译改变隐私、付费或功能状态。PR 请说明语言、修改原因及实际检查范围。
