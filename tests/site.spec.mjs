import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const sizes = [
    { width: 320, height: 700 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
];

for (const viewport of sizes) {
    test(`home has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/index.html?mode=explore');
        await expect(page.locator('#explore-content')).toBeVisible();
        const dimensions = await page.evaluate(() => ({
            viewport: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
        }));
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1);
    });

    test(`read pages have no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        for (const pathname of ['research.html', 'work.html', 'cv.html']) {
            await page.goto('/' + pathname);
            const { viewport: w, scroll } = await page.evaluate(() => ({
                viewport: document.documentElement.clientWidth,
                scroll: document.documentElement.scrollWidth,
            }));
            expect(scroll, pathname).toBeLessThanOrEqual(w + 1);
        }
    });
}

test('the no-JavaScript version is readable', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/index.html');
    await expect(page.locator('#read-content')).toBeVisible();
    await expect(page.locator('#explore-content')).toBeHidden();
    await expect(page.getByRole('link', { name: 'Research & Software' }).first()).toBeVisible();
    await context.close();
});

test('mode changes preserve active content and keyboard focus', async ({ page }) => {
    await page.goto('/index.html?mode=explore');
    await page.getByRole('button', { name: 'Or skip to the detailed version' }).click();
    await expect(page.locator('#read-content')).toBeVisible();
    await expect(page.locator('#explore-content')).toBeHidden();
    await expect(page.locator('#read-content')).toBeFocused();
    await expect(page).toHaveURL(/mode=read/);
    await page.locator('.mode-switch button[data-mode-choice="explore"]').click();
    await expect(page.locator('#explore-content')).toBeVisible();
    await expect(page).toHaveURL(/mode=explore/);
});

test('read preference works on a fresh visit', async ({ page }) => {
    await page.goto('/index.html?mode=read');
    await page.goto('/index.html');
    await expect(page.locator('#read-content')).toBeVisible();
});

test('mobile navigation opens and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html?mode=explore');
    const menu = page.locator('.nav-toggle');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Research', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
});

test('field notes keep links to the original research', async ({ page }) => {
    await page.goto('/index.html?mode=explore');
    await page.locator('[data-explore-key="thermobench"]').click();
    await expect(page.locator('#explore-note-dialog')).toBeVisible();
    await expect(page.locator('#explore-note-learn')).toHaveAttribute('href', 'research.html?mode=read#tb-title');
    await page.keyboard.press('Escape');
    await expect(page.locator('#explore-note-dialog')).toBeHidden();
});

test('interactive sketches respond and stay labelled as sketches', async ({ page }) => {
    await page.goto('/index.html?mode=explore');
    await expect(page.locator('.demo-disclaimer')).toHaveCount(2);
    await page.locator('#trajectory-param').evaluate(el => { el.value = '90'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('#trajectory-status')).toHaveText('high (illustration only)');
    await page.locator('#cost-increase').evaluate(el => { el.value = '13'; el.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('#build-verdict')).toContainText('FAIL');
    await page.locator('#wave-fire').click();
    await expect(page.locator('#wave-status')).toContainText('Schematic pulse');
});

test('puzzle is usable with a keyboard and reports state', async ({ page }) => {
    await page.goto('/index.html?mode=explore');
    await page.locator('#off-trail > summary').click();
    const open = page.locator('#open-puzzle');
    await open.focus();
    await page.keyboard.press('Enter');
    await expect(open).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.puzzle-light')).toHaveCount(9);
    await page.locator('.puzzle-light').first().focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#puzzle-status')).toBeVisible();
});

test('reduced-motion preference keeps navigation usable', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/index.html?mode=explore');
    await page.getByRole('button', { name: 'Or skip to the detailed version' }).click();
    await expect(page.locator('#read-content')).toBeVisible();
});

test('critical and serious accessibility findings are absent', async ({ page }) => {
    for (const path of ['/index.html?mode=explore', '/index.html?mode=read', '/research.html', '/work.html', '/cv.html']) {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).analyze();
        const important = results.violations.filter(v => ['critical', 'serious'].includes(v.impact));
        expect(important.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), path).toEqual([]);
    }
});
