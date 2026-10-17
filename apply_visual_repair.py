#!/usr/bin/env python3
"""Add the responsive visual-repair stylesheet to the current portfolio.

This does not overwrite site.css or the existing HTML. It adds one stylesheet
reference after the original site.css link, and is safe to run more than once.
"""
from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = ('index.html', 'research.html', 'work.html', 'cv.html', '404.html')
MARKER = '<link rel="stylesheet" href="assets/css/visual-repair.css" />'
BASE = '<link rel="stylesheet" href="assets/css/site.css" />'

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Inspect without writing')
    args = parser.parse_args()

    repair_file = ROOT / 'assets/css/visual-repair.css'
    tests_file = ROOT / 'tests/visual-layout.spec.mjs'
    if not repair_file.is_file() or not tests_file.is_file():
        raise SystemExit('Missing package files. Extract the ZIP into the repository root first.')

    changes = {}
    for page in PAGES:
        path = ROOT / page
        if not path.is_file():
            raise SystemExit(f'Missing page: {page}. Run from the repository root.')
        before = path.read_text(encoding='utf-8')
        if before.count(MARKER) == 1:
            print(f'Already configured: {page}')
            continue
        if before.count(BASE) != 1 or MARKER in before:
            raise SystemExit(f'Unexpected stylesheet tags in {page}; no pages updated. Review manually.')
        changes[path] = before.replace(BASE, BASE + '\n    ' + MARKER, 1)
        print(('Would update' if args.check else 'Updating') + f': {page}')

    if not args.check:
        for path, content in changes.items():
            path.write_text(content, encoding='utf-8')
        print(f'Updated {len(changes)} pages. The website source, JS and content were otherwise preserved.')
    else:
        print(f'Check OK. {len(changes)} pages need the stylesheet link.')

if __name__ == '__main__':
    main()
