#!/usr/bin/env python3
"""Apply the October 2026 copy edit without changing markup, layout, or code logic.

Usage:
    python apply_language_edit.py --check  # validate every source phrase; write nothing
    python apply_language_edit.py          # apply replacements atomically after validation

Guarded and idempotent: a mismatched source phrase causes a refusal rather than
silently replacing the wrong content. Inspect the resulting changes with git diff.
"""
from __future__ import annotations
import argparse
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parent
PATCH = json.loads((BASE / 'language_replacements.json').read_text(encoding='utf-8'))
ALLOWLIST = {'index.html', 'research.html', 'work.html', 'cv.html', 'assets/js/explore-notes.js'}


def plan(root: Path) -> tuple[dict[str, str], Counter, list[str]]:
    grouped = defaultdict(list)
    for n, e in enumerate(PATCH, start=1):
        if e['file'] not in ALLOWLIST:
            raise ValueError(f'Unexpected path in manifest: {e["file"]}')
        grouped[e['file']].append((n, e))

    updated = {}
    statuses = Counter()
    errors = []
    for relpath, edits in grouped.items():
        target = root / relpath
        if not target.is_file():
            errors.append(f'{relpath}: missing file')
            continue
        original = target.read_text(encoding='utf-8')
        result = original
        for number, e in edits:
            old, new = e['old'], e['new']
            n_old = result.count(old)
            n_new = result.count(new) if new else 0
            if n_old == 1 and (not new or n_new == 0):
                result = result.replace(old, new, 1)
                statuses['to_apply'] += 1
            elif n_old == 0 and ((new and n_new == 1) or not new):
                statuses['already_applied'] += 1
            else:
                errors.append(f'{relpath}: edit {number:02d}, expected one original phrase; found {n_old} '
                              f'(edited phrase appears {n_new} times). Source: {old[:105]!r}')
        updated[relpath] = result
    return updated, statuses, errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify every edit without writing files')
    parser.add_argument('--root', type=Path, default=Path.cwd(), help='Site repository root; default: current directory')
    args = parser.parse_args()
    root = args.root.resolve()
    if not (root / 'index.html').is_file() or not (root / 'assets/js').is_dir():
        print(f'Not a site repository root: {root}', file=sys.stderr)
        return 2
    updated, statuses, errors = plan(root)
    if errors:
        print('Language edit NOT applied. The local files differ from the version reviewed:')
        for e in errors:
            print('  - ' + e)
        print('Nothing has been changed. Compare your local copy with the manifest; do not force the patch.')
        return 1

    print(f'Checked {len(PATCH)} edits in {len(updated)} files: '
          f'{statuses["to_apply"]} pending; {statuses["already_applied"]} already applied.')
    if args.check:
        print('Check completed. No files written.')
        return 0
    # Validate every replacement first, then write only if all checks succeeded.
    for relpath, result in updated.items():
        target = root / relpath
        if result != target.read_text(encoding='utf-8'):
            target.write_text(result, encoding='utf-8')
            print(f'Updated {relpath}')
    print('Done. Review with: git diff --check && git diff')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
