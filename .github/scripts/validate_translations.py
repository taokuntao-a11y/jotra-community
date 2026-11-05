#!/usr/bin/env python3
"""Validate public translation proposals without product source or dependencies."""
from collections import Counter
from html.parser import HTMLParser
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
TOKENS = re.compile(r"%(?:\d+\$)?(?:lld|@)|\$\{[^}]+\}|\$[A-Za-z_]+\$")


class Markup(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        self.tags.append(("start", tag))
        self.links.extend((key, value) for key, value in attrs if key in ("href", "src", "id"))

    def handle_endtag(self, tag):
        self.tags.append(("end", tag))


def check(source, translated, path=""):
    if type(source) is not type(translated):
        raise ValueError(f"{path}: type differs from English")
    if isinstance(source, dict):
        if source.keys() != translated.keys():
            raise ValueError(f"{path}: keys differ from English")
        for key, value in source.items():
            check(value, translated[key], f"{path}/{key}")
    elif isinstance(source, list):
        if len(source) != len(translated):
            raise ValueError(f"{path}: item count differs from English")
        for index, (left, right) in enumerate(zip(source, translated)):
            if path.endswith("_sections") and left[0] != right[0]:
                raise ValueError(f"{path}/{index}: section ID changed")
            check(left, right, f"{path}/{index}")
    elif isinstance(source, str):
        if not translated.strip():
            raise ValueError(f"{path}: empty translation")
        if Counter(TOKENS.findall(source)) != Counter(TOKENS.findall(translated)):
            raise ValueError(f"{path}: placeholders changed")
        if "\\n" in translated:
            raise ValueError(f"{path}: double-escaped newline")
        if "/placeholders/" in path and source != translated:
            raise ValueError(f"{path}: Chrome placeholder metadata changed")
        if "<" in source or "<" in translated:
            left, right = Markup(), Markup()
            left.feed(source)
            right.feed(translated)
            if left.tags != right.tags or left.links != right.links:
                raise ValueError(f"{path}: HTML tags or destinations changed")


def main():
    languages = json.loads((ROOT / "translations/languages.json").read_text())
    source = json.loads((ROOT / "translations/en.json").read_text())
    for language in languages:
        translated = json.loads((ROOT / f"translations/{language}.json").read_text())
        check(source, translated, language)
    count = sum(len(strings) for strings in source["catalogs"].values())
    print(f"PASS: {len(languages)} languages; {count} native keys plus website, Safari and Chrome resources")


if __name__ == "__main__":
    main()
