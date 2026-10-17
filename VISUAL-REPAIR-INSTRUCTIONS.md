# Portfolio visual repair | October 2026

This is a small follow-up to the October 2026 portfolio refresh. It fixes several responsive-layout problems without rebuilding the site, changing its content, or replacing its art direction.

## Apply

Extract this ZIP over the root of `guptaaryanr.github.io` so that `apply_visual_repair.py`, `assets/`, and `tests/` land in the same structure as the website. Then run:

```bash
python apply_visual_repair.py --check
python apply_visual_repair.py
python tools/verify_site.py
npm install
npx playwright install chromium
npm test
```

The updater adds a stylesheet link to the homepage, Research, Experience, CV, and 404 pages. It is idempotent, and will stop before changing any files if the existing tags are unfamiliar. `site.css` remains unchanged. **There is no need to rerun `apply_portfolio_update.py`** from the previous package.

The added Playwright tests check the real HTML/CSS at 16 viewport widths, comparing bounding boxes for the six branch labels, Houston threads and result, two photos and their caption, and the project instruments and descriptions. They also check that the timeline is opaque behind text and that research metrics do not overflow their columns. Six widths receive attached screenshot captures for visual inspection. Existing `npm test` picks up the extra spec automatically.

## What changed

- Ann Arbor labels move to a two-column responsive arrangement with subtle dotted connectors.
- Houston inputs/results have separate grid cells rather than overlapping absolute coordinates.
- The decorative route no longer shows through editorial text or the expandable section.
- The photo collage uses natural layout height, bounded image crops, and a caption outside the images.
- The mobile personal-section heading keeps its arrow in the right column, not a separate line.
- Trajectory and Costgate descriptions gain breathing room below interactive instruments.
- WaveSleuth's four research metrics form a readable two-column grid on small screens.
- Tested widths: 320, 360, 390, 430, 467, 600, 700, 768, 820, 860, 861, 1024, 1180, 1366, 1440, and 1920 pixels.

## Rollback

Remove `<link rel="stylesheet" href="assets/css/visual-repair.css" />` from the five HTML files. The original styles remain unchanged.

## Test notes

A separate representative fixture was used to test the problematic markup and responsive rules in headless Chromium with synthetic images. That fixture passed all 16 widths, but it is not an offline copy of the entire site. The included Playwright spec runs against the actual website checkout. Use `npm test` there and inspect the report screenshots before pushing. Don't check in generated Playwright screenshots or reports unless needed.
