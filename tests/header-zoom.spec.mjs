import { test, expect } from '@playwright/test';

// The site used to overflow at 320px with a 20px root font because the AG mark,
// mode controls and hamburger could not fit beside the header's 2rem flex gaps.
// Test the offending header directly, not merely the document scroll width.
const cases = [
  { width: 320, font: 16 },
  { width: 320, font: 20 },
  { width: 320, font: 24 },
  { width: 320, font: 28 },
  { width: 390, font: 20 },
  { width: 390, font: 24 },
  { width: 520, font: 20 },
];

for (const { width, font } of cases) {
  test(`Header fits at ${width}px with ${font}px root text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/index.html?mode=explore');
    await page.addStyleTag({ content: `html { font-size: ${font}px !important; }` });
    await page.evaluate(() => document.fonts.ready);

    const measurement = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const selectors = ['.site-header .brand', '.site-header .mode-switch', '.site-header .nav-toggle'];
      const controls = selectors.map(selector => {
        const el = document.querySelector(selector);
        if (!el) return { selector, missing: true };
        const r = el.getBoundingClientRect();
        return { selector, left: r.left, right: r.right, top: r.top,
          bottom: r.bottom, width: r.width, height: r.height };
      });
      return { viewport, scrollWidth: document.documentElement.scrollWidth, controls };
    });

    expect(measurement.controls.filter(c => c.missing), JSON.stringify(measurement)).toEqual([]);
    const outOfBounds = measurement.controls.filter(c => c.left < -1 || c.right > measurement.viewport + 1);
    expect(outOfBounds, `Header elements outside the viewport: ${JSON.stringify(measurement)}`).toEqual([]);
    if (font === 20) {
      expect(measurement.scrollWidth,
        `Whole page should fit at ${width}px: ${JSON.stringify(measurement)}`)
        .toBeLessThanOrEqual(measurement.viewport + 2);
    }

    // Reflow is not useful if it leaves the navigation unusable.
    const toggle = page.locator('.site-header .nav-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.site-header .explore-nav')).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
}
