#!/usr/bin/env python3
"""Local integrity checks for the public portfolio. No third-party packages."""
from __future__ import annotations

import argparse
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / name for name in ('index.html', 'research.html', 'work.html', 'cv.html', '404.html')]


class Page(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.refs: list[tuple[str, str]] = []
        self.imgs: list[dict[str, str]] = []
        self.meta: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.html_attrs: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or '' for key, value in attrs}
        if tag == 'html': self.html_attrs = data
        if data.get('id'): self.ids.append(data['id'])
        for kind in ('href', 'src'):
            if data.get(kind): self.refs.append((kind, data[kind]))
        if tag == 'img': self.imgs.append(data)
        if tag == 'link': self.links.append(data)
        if tag == 'meta': self.meta.append(data)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--strict', action='store_true', help='fail on missing optional metadata')
    args = parser.parse_args()
    errors: list[str] = []
    warnings: list[str] = []
    pages: dict[str, Page] = {}
    for path in PAGES:
        page = Page()
        page.feed(path.read_text(encoding='utf-8'))
        pages[path.name] = page
        for key, value in Counter(page.ids).items():
            if value > 1: errors.append(f'{path.name}: duplicate id {key!r}')
        for img in page.imgs:
            if not img.get('alt') and 'alt' not in img:
                errors.append(f'{path.name}: image without alt attribute: {img.get("src")}')
            if not img.get('width') or not img.get('height'):
                warnings.append(f'{path.name}: image without explicit dimensions: {img.get("src")}')
        if path.name not in ('404.html',):
            canonical = [l for l in page.links if l.get('rel') == 'canonical']
            if len(canonical) != 1: errors.append(f'{path.name}: expected exactly one canonical link')
            if not any(m.get('property') == 'og:image' for m in page.meta):
                errors.append(f'{path.name}: no Open Graph preview image')
        if re.search(r'\bIncoming\b|London\s*/\s*next|\bI.m going to Imperial\b', path.read_text(encoding='utf-8'), re.I):
            errors.append(f'{path.name}: outdated Imperial status')

    for from_name, page in pages.items():
        for _, ref in page.refs:
            ref = ref.strip()
            if ref.startswith(('https:', 'http:', 'mailto:', 'tel:', 'data:', 'javascript:')): continue
            parsed = urlparse(ref)
            local = unquote(parsed.path)
            dest = local.lstrip('/') if local else from_name
            if dest.endswith('/'): dest += 'index.html'
            target = ROOT / dest
            if not target.exists(): errors.append(f'{from_name}: missing {ref}')
            if parsed.fragment:
                if target.suffix == '.html' and target.exists():
                    target_page = pages.get(target.name)
                    if target_page is None:
                        target_page = Page()
                        target_page.feed(target.read_text(encoding='utf-8'))
                    if unquote(parsed.fragment) not in target_page.ids:
                        errors.append(f'{from_name}: missing anchor in {ref}')
    # The field-note links are assigned in explore.js at runtime. Check their
    # destination HTML anchors without assuming that arbitrary strings are URLs.
    js = '\n'.join(p.read_text(encoding='utf-8') for p in (ROOT / 'assets/js').glob('explore*.js'))
    for ref in re.findall(r"\bhref:\s*'([^']+)'", js):
        p = urlparse(ref)
        if not p.fragment: continue
        target = ROOT / p.path
        if not target.exists(): errors.append(f'explore.js: missing {ref}'); continue
        dest_page = Page(); dest_page.feed(target.read_text(encoding='utf-8'))
        if p.fragment not in dest_page.ids: errors.append(f'explore.js: missing anchor in {ref}')

    if args.strict: errors += warnings
    for issue in warnings: print('WARNING:', issue)
    for issue in errors: print('ERROR:', issue)
    print(f'Checked {len(pages)} pages, {sum(len(p.refs) for p in pages.values())} local/external references.')
    if errors:
        print(f'{len(errors)} error(s), {len(warnings)} warning(s)')
        return 1
    print('Site integrity checks passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
