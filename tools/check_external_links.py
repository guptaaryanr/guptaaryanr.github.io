#!/usr/bin/env python3
"""Optional external-link check. Never blocks CI on bot defenses or rate limits."""
from __future__ import annotations

import concurrent.futures
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


class Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: set[str] = set()

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag in ('a', 'link'):
            href = d.get('href', '')
            if href.startswith(('https://', 'http://')) and 'guptaaryanr.github.io' not in href:
                self.urls.add(href.replace('&amp;', '&'))


def check(url: str) -> tuple[str, str]:
    headers = {'User-Agent': 'PortfolioLinkCheck/1.0 (+https://guptaaryanr.github.io/)'}
    for method in ('HEAD', 'GET'):
        req = Request(url, headers=headers, method=method)
        try:
            with urlopen(req, timeout=10) as r:
                return ('OK', f'{r.status} {url}')
        except HTTPError as e:
            if e.code in (403, 405, 429, 503) and method == 'HEAD':
                continue
            if e.code in (404, 410):
                return ('BROKEN', f'{e.code} {url}')
            return ('UNVERIFIED', f'{e.code} {url}')
        except (URLError, TimeoutError) as e:
            return ('UNVERIFIED', f'{type(e).__name__}: {url}')
    return ('UNVERIFIED', url)


def main() -> None:
    parser = Links()
    for file in ROOT.glob('*.html'):
        parser.feed(file.read_text(encoding='utf-8'))
    urls = sorted(parser.urls)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = sorted(pool.map(check, urls))
    for state, line in results:
        print(f'{state:10} {line}')
    counts = {kind: sum(1 for state, _ in results if state == kind)
              for kind in ('OK', 'BROKEN', 'UNVERIFIED')}
    print(f'{len(urls)} links checked: {counts}')
    if counts['BROKEN']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
