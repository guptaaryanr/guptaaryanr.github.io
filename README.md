# Portfolio v3.2: narrow-header / enlarged-text repair

The last v3.1 visual test revealed horizontal document overflow at a 320px viewport with `html { font-size: 20px !important; }`. The likely culprit is the header. Its original `2rem` flex gaps grow with the root font, leaving too little room for the AG mark, Explore/Read switch, and menu button. Reproducing the header independently produces a 32px overflow, consistent with the reported 35px.

The fix changes only the **mobile header** (700px and below). It reduces flex gaps and mode-button padding, retains 44px minimum control heights, and allows a second row when users enlarge text further. It does not use `overflow-x: hidden` or clip interactive controls.

## Install

Extract this ZIP into the root of your **already updated v3 + v3.1** repository, preserving folders. Then run:

```bash
python apply_v3_2.py --check
python apply_v3_2.py
npx playwright test tests/header-zoom.spec.mjs tests/visual-layout.spec.mjs
npm test
```

The installer **appends** the CSS to `assets/css/visual-repair.css` without replacing existing changes. It checks for the v3 marker and is idempotent, so running it again changes nothing. A separate test file checks component geometry and menu functionality at multiple viewport/font combinations.

## Verification

A Chromium rendering of the header matching the site's markup and CSS was tested with root fonts 16, 18, 20, 22, 24 and 28px at viewport widths 320, 360, 390, 430, 520, 700 and 820px. The original header exceeded the 320px viewport by approximately 32px at a 20px root font; the patched version did not overflow in any of those cases.

The v3 representative layout fixture with the same header added was also checked at 8 widths × 4 root font sizes (32 combinations), with no document overflow after this patch. **These are controlled reconstructions, not a full run of the user's local repository.** The included Playwright tests should verify the actual website before pushing.

## Files

- `apply_v3_2.py`: guarded, repeatable installer
- `tools/header-zoom.css`: mobile-header CSS fix
- `tests/header-zoom.spec.mjs`: new regression tests

No site copy, project layout, or external links are changed.
