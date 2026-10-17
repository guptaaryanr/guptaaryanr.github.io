# Visual QA notes

## Reproduced issues from the supplied screenshots

The screenshots show narrow desktop, half-screen, and mobile states. The problems originate mostly from positioning choices that don't adapt to their actual content.

1. **Ann Arbor graphic:** Fixed coordinates for six links allow labels to overlap or form an awkward bunch as the available width changes. The SVG's curves still point toward fixed places even when the labels wrap. The repaired layout positions the actual links in a responsive grid, with a restrained connector line.
2. **Houston graphic:** Three inputs and the destination title share the same absolute-positioning canvas. The title can run over the inputs, particularly in the half-screen screenshot. The repaired grid reserves separate columns for inputs and conclusion.
3. **Route under prose:** The central path is visible through a translucent background under the reflective sentence and personal-section header. The repaired content surfaces are opaque while the route remains visible around them.
4. **Photograph/caption overlap:** The photo stack is fixed at 15rem tall, while its absolutely positioned, rotated images have no corresponding flow height. The next paragraph can appear behind the photographs. The repair makes the images flow-sized, bounded, cropped deliberately, and independent of the caption.
5. **Personal section mobile header:** The expansion arrow becomes a third row in the small-screen grid. It is now anchored in a dedicated right-hand column; subtitle stays beneath the heading.
6. **Mobile Trajectory and Costgate:** The project copy immediately follows the instrument edge with no separation. The repair adds a consistent vertical gap and guards control/label widths under text zoom.
7. **Research metrics:** Four equal-width columns at phone sizes make long experiment labels difficult to read. Below 700px the metrics form two columns, with matching border treatment.

## Other layout risks reviewed

- At narrow widths, timeline dots sit beside the content while instrument cards expand vertically. The repair doesn't move the route itself, but prevents side-card collisions.
- Personal photographs are checked against the caption, not each other. Their intentional small overlap is retained.
- Content containers use `min-width:0` where intrinsic content used to push grid tracks wider than expected.
- Smaller labels use wrapping; no fixed absolute placement is retained for the Houston and Ann Arbor text.
- At 721 to 860px, the personal drawer stays in two columns, avoiding large unused space. It becomes one column on narrower screens.
- Source copy, brand styling, primary fonts, and research claims are unchanged.

## Browser verification

A local reproduction of the affected markup and CSS rules was rendered in Chromium. An automated bounding-box suite was exercised at **16 viewport widths**: 320, 360, 390, 430, 467, 600, 700, 768, 820, 860, 861, 1024, 1180, 1366, 1440, and 1920 pixels. All 16 passed after the stylesheet repair. Before applying the repair, the same representative fixture detected collisions and zero-gap mobile project sections, which confirms that the new checks are capable of finding regressions.

The fixture is a representative reproduction, **not a full offline copy of the GitHub Pages website**. It uses synthetic photographs and does not validate browser navigation or scripts. The package adds `tests/visual-layout.spec.mjs` to the website's existing Playwright suite to run these checks against the real pages when installed and tested locally or on GitHub Actions. Six widths also attach section screenshots for human review. The full-site Playwright suite hasn't been executed inside this environment.

## How to review screenshots locally

```bash
npx playwright test tests/visual-layout.spec.mjs --reporter=html
npx playwright show-report
```

Inspect the screenshot attachments at 320, 390, 600, 820, 1024, and 1440 pixels. Check especially the top and bottom edges of the photographs, title wrapping, and section transitions, not just horizontal scrolling.

## What still needs manual checking

Test real browsers with the actual assets, including Firefox, Safari/WebKit, a resized desktop browser with scrollbars visible, 200% browser zoom, keyboard focus, and mobile landscape mode. CSS geometry tests aren't a substitute for reading the page carefully with human eyes. The checks are intended to flag repeatable failures before deployment.
