#!/usr/bin/env python3
"""Check local Markdown links in Project Atlas documentation."""

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SEARCH_PATHS = [
    ROOT / "README.md",
    ROOT / "docs",
    ROOT / "frontend" / "README.md",
]

# Match ordinary inline Markdown links.
LINK_PATTERN = re.compile(r'(?<!!)\[[^\]]+\]\(([^)]+)\)')


def markdown_files():
    """Yield root and documentation Markdown files."""
    for path in SEARCH_PATHS:
        if path.is_file():
            yield path
        elif path.is_dir():
            yield from sorted(path.rglob("*.md"))


def check_file(path):
    """Return broken local links from a Markdown document."""
    failures = []
    content = path.read_text(encoding="utf-8")

    for match in LINK_PATTERN.finditer(content):
        target = match.group(1).strip()

        # Ignore external URLs, mail links, and local anchors.
        if (
            target.startswith("#")
            or target.startswith("mailto:")
            or target.startswith("http://")
            or target.startswith("https://")
        ):
            continue

        parsed = urlsplit(target)
        destination = unquote(parsed.path)

        if not destination:
            continue

        resolved = (path.parent / destination).resolve()

        if not resolved.is_relative_to(ROOT):
            failures.append((path, target, "outside repository"))
        elif not resolved.exists():
            failures.append((path, target, "missing target"))

    return failures


def main():
    """Validate documentation and report missing targets."""
    files = list(markdown_files())
    failures = []

    for path in files:
        failures.extend(check_file(path))

    print(f"Checked {len(files)} Markdown documents.")

    if failures:
        print(f"Found {len(failures)} broken local links:")
        for path, target, reason in failures:
            print(f"  {path.relative_to(ROOT)}: {target} ({reason})")
        return 1

    print("PASS: All detected local Markdown links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
