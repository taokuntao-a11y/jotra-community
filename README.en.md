# Jotra community

[中文](README.md) · [Website](https://jotra.henkeyi.com/)

Help improve Jotra through feedback, translations, documentation, and external adapters. **Product source code remains private.**

[Report an issue](https://github.com/taokuntao-a11y/jotra-community/issues/new/choose) · [Plugin collaboration](integrations/README.md) · [Contributing](CONTRIBUTING.md) · [Discussions](https://github.com/taokuntao-a11y/jotra-community/discussions)

The website provides product information, help, privacy notices, and developer documentation with external links. Community discussions, contribution review, and any future plugin collaboration belong on GitHub or separately announced channels, not inside the website.

- Report a problem or suggest an improvement using an issue template.
- Improve translations in `translations/<language>.json`; see [the translation guide](TRANSLATING.md).
- Propose an external plugin or workflow; check [integration status](PLUGINS.md) first.
- Improve public documentation without access to product implementation.

The first Mac release is a local notebook. Free local CLI writing, Codex MCP integration, and the first Obsidian selection adapter have passed isolated end-to-end preview tests. A compatible preview App, CLI, and MCP package must be supplied separately; no public binary download is provided here. The submitted App Store build is separate from this preview.

Actual Codex creation, replay, and receipt lookup passed. MCP replay after restarting the Jotra App remains pending; see the validation record.

[CLI authorization, writing, and receipts](docs/local-tools.md) · [Codex MCP setup](docs/mcp-codex.md) · [Obsidian example](integrations/obsidian-selection/README.md) · [Tested versions and limits](docs/validation.md)

Do not include private notes, databases, credentials, or pairing materials in issues or pull requests. Contact [hello@go2come.com](mailto:hello@go2come.com) privately for sensitive reports or feedback without a GitHub account.

This repository contains public copy resources, documentation, collaboration configuration, and an independent external adapter example. It does not contain product implementations of the app, Core, CLI, MCP, or relay. No general open-source license has been added; see [RIGHTS.md](RIGHTS.md).

Run `python3 .github/scripts/validate_translations.py` for translations and `npm test` inside `integrations/obsidian-selection` for the adapter. Pull requests run both checks.
