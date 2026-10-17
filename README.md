# Aryan Gupta | Website

Personal website: <https://guptaaryanr.github.io/>. Plain HTML, CSS and JavaScript, deployed with GitHub Pages.

The home page has two views: **Explore**, a scrollable visual trail, and **Read**, a conventional portfolio. Pages for research, experience, and the CV are available directly from either view. The Read version is also the fallback when JavaScript is disabled.

## Run locally

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/`. No build step or framework is required to serve the site.

## Check changes

```sh
python3 tools/verify_site.py
npm install
npx playwright install chromium
npm test
```

`verify_site.py` checks local assets, links, fragment targets, image metadata, and basic search metadata. Run `python3 tools/check_external_links.py` to check third-party links on demand; bot defenses and rate limits are reported as inconclusive rather than broken. The Playwright suite checks layout widths, mode switching, keyboard behaviour, simplified scientific illustrations, and serious accessibility issues across the public pages. GitHub Actions runs both on pushes and pull requests.

## Content notes

- The interactive instruments on the Explore home page are **illustrations**, not live executions of WaveSleuth, RegimeAtlas, ThermoBench, or Costgate.
- The WaveSleuth scores on the research page reproduce the v1.0.0 release-note **reference IoU** values. Different challenges use different configurations; these aren't comparable external test-set scores.
- The trajectory study uses full-state trajectories from two deterministic benchmark families; the hidden model-specific definitions are used only at evaluation.
- ThermoBench-Consist v1 checks **pure-fluid EOS** behaviour. The mixture VLE study motivated it but is not solved by the benchmark.
- CostRegBench uses controlled fixtures, not production LLM workload statistics.
- The `assets/cv/Aryan-Gupta-CV.pdf` file is independently maintained. Refresh the PDF when your role dates or education change; the HTML status is kept current here.

## Maintenance

The site is hosted at the repository root, with static assets in `assets/`. The home-page JavaScript is divided into navigation (`site.js`), motion (`explore.js`), instruments (`explore-instruments.js`) and field notes (`explore-notes.js`). Keep `robots.txt`, `sitemap.xml`, `index.html` metadata, and the social preview card consistent when paths or titles change.

Project results should link back to release notes, papers, or reproducible repository commands. Use actual measured outputs for research figures and label illustrations as such.
