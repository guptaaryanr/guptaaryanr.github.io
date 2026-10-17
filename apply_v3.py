#!/usr/bin/env python3
"""Apply the v3 responsive content-order repair to the website checkout.

Run from anywhere after extracting this ZIP over the repository root.
Only index.html is edited; the v3 stylesheet and tests arrive as regular files.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HOME = ROOT / "index.html"
STYLE = ROOT / "assets/css/visual-repair.css"
TEST = ROOT / "tests/visual-layout.spec.mjs"
TARGETS = {
    "ann-arbor": ("trail-card", "trail-pin", "branch-field"),
    "station-traj": ("landmark-copy", "trail-pin", "instrument"),
    "station-cost": ("landmark-copy", "trail-pin", "instrument"),
    "london": ("trail-card", "trail-pin", "london-blank"),
}
TAGS = re.compile(r"</?div\b[^>]*>", re.I)
ARTICLES = re.compile(
    r'(?P<open><article\b[^>]*\bid="(?P<id>ann-arbor|station-traj|station-cost|london)"[^>]*>)'
    r'(?P<body>[\s\S]*?)(?P<close></article>)', re.I,
)


def top_level_divs(body: str) -> list[tuple[str, str]]:
    depth = 0
    start = -1
    blocks = []
    for found in TAGS.finditer(body):
        is_close = found.group().startswith('</')
        if not is_close:
            if depth == 0:
                start = found.start()
            depth += 1
        else:
            depth -= 1
            if depth < 0:
                raise ValueError("Unbalanced closing </div> inside an article")
            if depth == 0:
                block = body[start:found.end()]
                leading = block.split('>', 1)[0]
                match = re.search(r'\bclass=["\']([^"\']+)', leading)
                if not match:
                    raise ValueError("Unclassified direct child of article")
                tokens = set(match.group(1).split())
                matched = [k for k in ('trail-card', 'landmark-copy', 'trail-pin', 'branch-field', 'instrument', 'london-blank') if k in tokens]
                if len(matched) != 1:
                    raise ValueError(f"Unexpected article child classes: {tokens}")
                blocks.append((matched[0], block))
    if depth != 0 or len(blocks) != 3:
        raise ValueError(f"Expected three balanced direct child divs; found {len(blocks)}")
    return blocks


def updated_home(content: str) -> tuple[str, list[str]]:
    counts = {key: 0 for key in TARGETS}
    changed = []

    def replace(m: re.Match[str]) -> str:
        key = m.group('id')
        counts[key] += 1
        original = top_level_divs(m.group('body'))
        order = TARGETS[key]
        classes = [x[0] for x in original]
        if set(classes) != set(order):
            raise ValueError(f"#{key}: article child classes changed: {classes}")
        # Preserve all nested HTML verbatim; only move complete child blocks.
        if classes == list(order):
            return m.group(0)
        body = m.group('body')
        first = re.search(r'\n([ \t]*)<div\b', body)
        indent = first.group(1) if first else ' ' * 20
        last = re.search(r'\n([ \t]*)$', body)
        close_indent = last.group(1) if last else ' ' * 16
        fragments = dict(original)
        rewritten = '\n' + ('\n'.join(indent + fragments[name].strip() for name in order)) + '\n' + close_indent
        changed.append(key)
        return m.group('open') + rewritten + m.group('close')

    after = ARTICLES.sub(replace, content)
    if any(counts[k] != 1 for k in TARGETS):
        raise ValueError('Expected exactly one copy of each targeted article. Found ' + str(counts))
    if after.count('visual-repair.css') != 1:
        raise ValueError('This update expects the v2 site with one visual-repair.css link.')
    # Fail early if any of the reorder targets disappeared from the result.
    for key, order in TARGETS.items():
        match = next((m for m in ARTICLES.finditer(after) if m.group('id') == key), None)
        assert match is not None
        actual = [name for name, _ in top_level_divs(match.group('body'))]
        if actual != list(order):
            raise ValueError(f"#{key}: failed to establish intended source order")
    return after, changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify compatibility without editing')
    args = parser.parse_args()
    for path in [HOME, STYLE, TEST]:
        if not path.is_file():
            parser.error(f"Missing {path.relative_to(ROOT)}. Extract the entire v3 ZIP into the website checkout.")
    if 'V3 RESPONSIVE REPAIR' not in STYLE.read_text(encoding='utf-8'):
        parser.error('The v3 stylesheet is missing. Extract the ZIP, overwriting visual-repair.css.')
    before = HOME.read_text(encoding='utf-8')
    try:
        after, changed = updated_home(before)
    except ValueError as exc:
        parser.error(str(exc))
    if args.check:
        print('Compatibility check passed.')
        print('Article source order:', ', '.join(changed) if changed else 'already correct')
        return
    if after != before:
        HOME.write_text(after, encoding='utf-8')
        print('Updated index.html source order:', ', '.join(changed))
    else:
        print('index.html already has the intended source order. No change.')
    print('v3 stylesheet and tests are in place. Run: npm test')


if __name__ == '__main__':
    main()
