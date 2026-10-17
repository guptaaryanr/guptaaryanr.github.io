import { test, expect } from '@playwright/test';

// Geometry catches collisions even when scrollWidth stays equal to viewport width.
// The polaroids deliberately overlap each other; they must not overlap captions.
const VIEWPORTS = [
  320, 360, 390, 430, 467, 600, 700, 768,
  820, 860, 861, 1024, 1180, 1366, 1440, 1920,
];
const SCREENSHOT_WIDTHS = new Set([320, 390, 600, 820, 1024, 1440]);

function collectGeometry() {
  const rects = selector => [...document.querySelectorAll(selector)]
    .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
    .map(el => {
      const r = el.getBoundingClientRect();
      return {
        name: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 48),
        left: r.left, top: r.top, right: r.right, bottom: r.bottom,
        width: r.width, height: r.height,
        scrollWidth: el.scrollWidth, clientWidth: el.clientWidth,
      };
    });
  const intersectArea = (a, b) =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

  const errors = [];
  const branches = rects('.branch-field .branch-tag');
  const threads = rects('.convergence-field .thread');
  const conclusion = rects('.convergence-field > strong')[0];
  const photos = rects('.personal-photo-stack .mini-photo');
  const caption = rects('.photo-nook > p:last-child')[0];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      if (intersectArea(branches[i], branches[j]) > 2) {
        errors.push(`Branch labels collide: ${branches[i].name} / ${branches[j].name}`);
      }
    }
  }
  for (let i = 0; i < threads.length; i++) {
    for (let j = i + 1; j < threads.length; j++) {
      if (intersectArea(threads[i], threads[j]) > 2) {
        errors.push(`Convergence input labels collide: ${threads[i].name} / ${threads[j].name}`);
      }
    }
    if (conclusion && intersectArea(threads[i], conclusion) > 2) {
      errors.push(`Convergence result obscures input: ${threads[i].name}`);
    }
  }
  for (const photo of photos) {
    if (caption && intersectArea(photo, caption) > 2) {
      errors.push(`Photo obscures caption: ${photo.name}`);
    }
  }
  if (branches.length !== 6 || threads.length !== 3 || photos.length !== 2 || !conclusion || !caption) {
    errors.push('A tested diagram or its caption is missing.');
  }
  // Pseudo-elements used as decorative connectors may extend a few pixels beyond
  // branch labels, so don't interpret their scrollWidth as overflowing text.
  for (const item of [...threads, conclusion].filter(Boolean)) {
    if (item.scrollWidth > item.clientWidth + 2) {
      errors.push(`Text does not fit its column: ${item.name}`);
    }
  }
  if (innerWidth <= 860) {
    for (const section of ['#station-traj', '#station-cost']) {
      const figure = rects(`${section} > .instrument`)[0];
      const copy = rects(`${section} > .landmark-copy`)[0];
      if (!figure || !copy) {
        errors.push(`Missing instrument or description in ${section}`);
      } else if (copy.top - figure.bottom < 12) {
        errors.push(`Description touches instrument in ${section}: ${Math.round(copy.top - figure.bottom)}px`);
      }
    }
  }

  for (const selector of ['.quiet-thought', '.side-path', '.side-path summary']) {
    const node = document.querySelector(selector);
    if (!node) { errors.push(`${selector} missing`); continue; }
    const color = getComputedStyle(node).backgroundColor;
    const match = color.match(/^rgba?\(([^)]+)\)$/);
    if (!match) { errors.push(`${selector} has no opaque route mask`); continue; }
    const parts = match[1].split(',').map(s => Number(s.trim()));
    if (parts.length < 3 || (parts.length === 4 && parts[3] < .999)) {
      errors.push(`${selector} is transparent, so the route can cross its text`);
    }
  }

  const documentWidth = document.documentElement.scrollWidth;
  const viewportWidth = document.documentElement.clientWidth;
  if (documentWidth > viewportWidth + 1) {
    errors.push(`Horizontal overflow by ${documentWidth - viewportWidth}px`);
  }
  return { errors, width: innerWidth, documentWidth, viewportWidth };
}

for (const width of VIEWPORTS) {
  test(`Explore layout has no collisions at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 840 });
    await page.goto('/index.html?mode=explore');
    await page.locator('#off-trail').evaluate(el => { el.open = true; });
    // Lazy photographs are requested only once this section enters view.
    await page.locator('.photo-nook img').first().scrollIntoViewIfNeeded();
    await page.locator('.photo-nook img').first().evaluate(async image => {
      if (!image.complete) await new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); });
    });
    // Wait for fonts and image layout before measuring.
    await page.evaluate(() => document.fonts.ready);
    const audit = await page.evaluate(collectGeometry);

    if (SCREENSHOT_WIDTHS.has(width)) {
      for (const [name, selector] of [
        ['branches', '#ann-arbor'],
        ['convergence', '#houston'],
        ['personal', '#off-trail'],
        ['trajectory', '#station-traj'],
        ['costgate', '#station-cost'],
      ]) {
        const shot = await page.locator(selector).screenshot({ animations: 'disabled' });
        await testInfo.attach(`${width}-${name}`, { body: shot, contentType: 'image/png' });
      }
    }
    expect(audit.errors, `Visual collisions at ${width}px`).toEqual([]);
  });
}

for (const width of [320, 390, 600, 820, 1024, 1440]) {
  test(`Research metrics remain legible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 840 });
    await page.goto('/research.html');
    const metrics = await page.locator('.metric-strip').evaluate(strip => {
      const cells = [...strip.querySelectorAll('span')];
      return {
        count: cells.length,
        cols: getComputedStyle(strip).gridTemplateColumns.split(' ').length,
        overs: cells.filter(cell => cell.scrollWidth > cell.clientWidth + 2).map(cell => cell.textContent.trim()),
      };
    });
    expect(metrics.count).toBe(4);
    expect(metrics.overs).toEqual([]);
    if (width <= 700) expect(metrics.cols).toBe(2);
  });
}
