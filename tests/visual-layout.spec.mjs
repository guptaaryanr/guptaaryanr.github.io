import { test, expect } from '@playwright/test';

// These checks run against the actual website, not a screenshot mock-up.
// An element can stay inside the viewport and still obscure another element.
const WIDTHS = [
  320, 360, 390, 430, 467, 520, 600, 700, 768, 820, 860,
  900, 960, 1020, 1021, 1100, 1180, 1280, 1366, 1440, 1600, 1920,
];
const SHOTS = new Set([320, 390, 600, 820, 1020, 1021, 1440]);

// Returns only geometry and defects, so errors include actual measurements.
function inspectExploreLayout() {
  // Playwright serializes this function into the browser. It must not capture
  // variables declared in this test file's Node.js module scope.
  const STAGES = [
    '#ann-arbor', '#houston', '#station-thermo', '#station-traj',
    '#station-waves', '#station-cost', '#london',
  ];
  const box = node => {
    if (!node || !node.getClientRects().length) return null;
    const r = node.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return { x: r.x, y: r.y, left: r.left, right: r.right, top: r.top,
      bottom: r.bottom, width: r.width, height: r.height };
  };
  const one = selector => box(document.querySelector(selector));
  const overlap = (a, b) => a && b
    ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
    : 0;
  const centerX = r => r.left + r.width / 2;
  const centerY = r => r.top + r.height / 2;
  const defects = [];
  const width = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > width + 2) {
    defects.push(`page horizontally overflows by ${document.documentElement.scrollWidth - width}px`);
  }

  const rail = one('.trail-route-map');
  for (const selector of [
    '#abu-dhabi', ...STAGES,
  ]) {
    const stage = document.querySelector(selector);
    if (!stage) { defects.push(`${selector}: section missing`); continue; }
    const copy = box(stage.querySelector(':scope > .trail-card, :scope > .landmark-copy'));
    const visualNode = stage.querySelector(':scope > .instrument, :scope > .branch-field, :scope > .convergence-field, :scope > .london-blank');
    const visual = box(visualNode);
    const pin = box(stage.querySelector(':scope > .trail-pin'));
    if (!copy || !pin) { defects.push(`${selector}: missing copy or pin`); continue; }
    if (window.innerWidth <= 1020) {
      if (visual && visual.top - copy.bottom < 14) {
        defects.push(`${selector}: graphic is only ${(visual.top - copy.bottom).toFixed(1)}px below copy`);
      }
      if (rail && Math.abs(centerX(pin) - centerX(rail)) > 3) {
        defects.push(`${selector}: pin is ${(centerX(pin) - centerX(rail)).toFixed(1)}px from route centre`);
      }
      if (copy.left < 0 || copy.right > width + 2) {
        defects.push(`${selector}: text extends off screen`);
      }
      if (visual && (visual.left < -1 || visual.right > width + 2)) {
        defects.push(`${selector}: graphic extends off screen`);
      }
    } else if (visual) {
      const right = stage.classList.contains('stage-right');
      if (right ? visual.right > copy.left + 3 : copy.right > visual.left + 3) {
        defects.push(`${selector}: two-column content crosses the centre gutter`);
      }
      if (Math.abs(centerY(copy) - centerY(visual)) > 40) {
        defects.push(`${selector}: column centres differ vertically by ${Math.round(Math.abs(centerY(copy) - centerY(visual)))}px`);
      }
    }
  }

  const branches = [...document.querySelectorAll('.branch-field .branch-tag')];
  const threads = [...document.querySelectorAll('.convergence-field .thread')];
  const result = one('.convergence-field > strong');
  if (branches.length !== 6 || threads.length !== 3 || !result) {
    defects.push('branch or convergence content missing');
  }
  for (const [label, collection] of [['branch', branches], ['convergence', threads]]) {
    for (let i = 0; i < collection.length; i++) {
      for (let j = i + 1; j < collection.length; j++) {
        if (overlap(box(collection[i]), box(collection[j])) > 4) {
          defects.push(`${label} labels collide: ${collection[i].textContent.trim()} / ${collection[j].textContent.trim()}`);
        }
      }
    }
  }
  for (const thread of threads) {
    if (overlap(box(thread), result) > 4) defects.push(`convergence result obscures ${thread.textContent.trim()}`);
  }

  const images = [...document.querySelectorAll('.personal-photo-stack .mini-photo')];
  const photoCaption = one('.photo-nook > p:last-child');
  if (images.length !== 2 || !photoCaption) defects.push('photo collage or caption missing');
  for (const image of images) {
    if (overlap(box(image), photoCaption) > 4) defects.push('photo obscures its caption');
  }
  const summary = document.querySelector('#off-trail summary');
  if (summary) {
    const heading = box(summary.querySelector('span'));
    const subtitle = box(summary.querySelector('small'));
    if (overlap(heading, subtitle) > 4) defects.push('drawer heading overlaps subtitle');
    if (summary.scrollWidth > summary.clientWidth + 3) defects.push('drawer header content overflows');
  }
  for (const selector of ['.quiet-thought', '.side-path', '.side-path summary']) {
    const el = document.querySelector(selector);
    if (!el) { defects.push(`${selector}: missing`); continue; }
    const rgba = getComputedStyle(el).backgroundColor.match(/^rgba?\(([^)]+)\)$/);
    if (!rgba || (rgba[1].split(',').length === 4 && Number(rgba[1].split(',')[3]) < .999)) {
      defects.push(`${selector}: translucent surface allows route through text`);
    }
  }
  return { width, defects };
}

async function readyExplore(page, width, height = 850) {
  await page.setViewportSize({ width, height });
  await page.goto('/index.html?mode=explore');
  await expect(page.locator('#explore-content')).toBeVisible();
  await page.locator('#off-trail').evaluate(el => { el.open = true; });
  await page.locator('.photo-nook img').first().scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.photo-nook img').first().evaluate(async img => {
    if (!img.complete) await new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  });
}

// Catch test-harness mistakes independently of viewport-specific layout failures.
// In particular, browser-side inspectors must be self-contained when passed
// to page.evaluate; Node.js constants are not in scope inside the browser.
test('layout inspector runs in the browser', async ({ page }) => {
  await readyExplore(page, 390);
  const report = await page.evaluate(inspectExploreLayout);
  expect(report.width).toBe(390);
  expect(Array.isArray(report.defects)).toBe(true);
});

for (const width of WIDTHS) {
  test(`Explore layout: physical collisions at ${width}px`, async ({ page }, info) => {
    test.setTimeout(70_000);
    await readyExplore(page, width);
    const report = await page.evaluate(inspectExploreLayout);
    if (SHOTS.has(width)) {
      for (const [name, selector] of [
        ['ann-arbor', '#ann-arbor'], ['houston', '#houston'],
        ['thermobench', '#station-thermo'], ['trajectory', '#station-traj'],
        ['wavesleuth', '#station-waves'], ['costgate', '#station-cost'],
        ['personal', '#off-trail'], ['london', '#london'],
      ]) {
        const png = await page.locator(selector).screenshot({ animations: 'disabled' });
        await info.attach(`${width}-${name}`, { body: png, contentType: 'image/png' });
      }
    }
    expect(report.defects, `${width}px layout defects`).toEqual([]);
  });
}

// Source order matters for reading order, tabbing, and non-CSS environments.
test('all story sections have copy-first source order', async ({ page }) => {
  await page.goto('/index.html?mode=explore');
  for (const section of [
    '#ann-arbor', '#houston', '#station-thermo', '#station-traj',
    '#station-waves', '#station-cost', '#london',
  ]) {
    const order = await page.locator(section).evaluate(el =>
      [...el.children].map(child => {
        if (child.classList.contains('trail-card') || child.classList.contains('landmark-copy')) return 'copy';
        if (child.classList.contains('trail-pin')) return 'pin';
        return 'graphic';
      }),
    );
    expect(order, `${section} source order`).toEqual(['copy', 'pin', 'graphic']);
  }
});

for (const width of [320, 390, 600, 820, 1020, 1021, 1440]) {
  test(`Read pages: typography, metrics and overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    for (const location of ['/index.html?mode=read', '/research.html', '/work.html', '/cv.html', '/404.html']) {
      await page.goto(location);
      const problem = await page.evaluate(() => {
        const doc = document.documentElement;
        const h1 = [...document.querySelectorAll('h1')].find(h => h.getClientRects().length);
        return {
          width: doc.clientWidth, scroll: doc.scrollWidth,
          h1: Boolean(h1 && h1.getBoundingClientRect().width),
        };
      });
      expect(problem.h1, `${location}: missing heading`).toBe(true);
      expect(problem.scroll, `${location}: horizontal overflow`).toBeLessThanOrEqual(problem.width + 2);
      if (location === '/research.html') {
        const strip = page.locator('.metric-strip');
        await expect(strip).toBeVisible();
        const metrics = await strip.evaluate(el => ({
          cols: getComputedStyle(el).gridTemplateColumns.split(' ').length,
          overflow: [...el.querySelectorAll('span')].filter(cell => cell.scrollWidth > cell.clientWidth + 3).length,
        }));
        expect(metrics.overflow, 'Research challenge score labels').toBe(0);
        if (width <= 700) expect(metrics.cols).toBe(2);
      }
    }
  });
}

for (const width of [320, 390, 820]) {
  test(`Explore layout survives enlarged text at ${width}px`, async ({ page }) => {
    await readyExplore(page, width);
    await page.addStyleTag({ content: 'html { font-size: 20px !important; }' });
    const result = await page.evaluate(inspectExploreLayout);
    expect(result.defects, `20px root font at ${width}px`).toEqual([]);
  });
}

test('landscape phone does not clip the narrative', async ({ page }) => {
  await readyExplore(page, 740, 360);
  const report = await page.evaluate(inspectExploreLayout);
  expect(report.defects).toEqual([]);
});
