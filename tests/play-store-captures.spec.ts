import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const outputDir = path.resolve('docs/android/play-store/assets/source/screens');

test.use({
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

const cleanScreenshot = async (page: Page, name: string) => {
  await page.evaluate(() => {
    document.querySelectorAll('nextjs-portal').forEach((portal) => portal.remove());
  });
  await expect(page.locator('nextjs-portal')).toHaveCount(0);
  await expect(page.getByText('PAUSE', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: path.join(outputDir, name) });
};

const selectPvp = async (page: Page) => {
  const settings = page.getByTestId('settings-toggle');
  await settings.click();
  const pvp = page.getByTestId('mode-pvp');
  await pvp.scrollIntoViewIfNeeded();
  await pvp.click();
  await expect(pvp).toHaveAttribute('aria-pressed', 'true');
  return settings;
};

const resumeIfNeeded = async (page: Page) => {
  const pause = page.getByTestId('pause-toggle');
  if ((await pause.getAttribute('title')) === 'Resume') {
    await pause.click();
  }
};

test('captures the clean English Play Store campaign states', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await resumeIfNeeded(page);

  const settings = page.getByTestId('settings-toggle');
  await settings.click();

  const gameModeLabel = page.getByText('Game Mode', { exact: true });
  await gameModeLabel.scrollIntoViewIfNeeded();
  await cleanScreenshot(page, '02-modes.png');

  const online = page.getByTestId('mode-online');
  await online.click();
  await expect(online).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('online-create-game')).toBeVisible();
  await gameModeLabel.scrollIntoViewIfNeeded();
  await cleanScreenshot(page, '04-online.png');

  const pvp = page.getByTestId('mode-pvp');
  await pvp.click();
  await expect(pvp).toHaveAttribute('aria-pressed', 'true');

  const funMode = page.getByText('Fun Mode', { exact: true }).first();
  await funMode.scrollIntoViewIfNeeded();
  await cleanScreenshot(page, '03-variants.png');

  const tabletopLabel = page.getByText('Tabletop Mode', { exact: true });
  await tabletopLabel.scrollIntoViewIfNeeded();
  await cleanScreenshot(page, '05-customization.png');

  await settings.click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await resumeIfNeeded(page);
  for (const column of [3, 2, 3, 2, 4, 1]) {
    await page.getByTestId(`board-column-${column}`).click();
  }
  await cleanScreenshot(page, '01-gameplay.png');
});

test('captures a visibly flipped tabletop-mode board', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await resumeIfNeeded(page);

  const settings = await selectPvp(page);
  const tabletopLabel = page.getByText('Tabletop Mode', { exact: true });
  await tabletopLabel.scrollIntoViewIfNeeded();
  const tabletopToggle = tabletopLabel.locator('..').getByRole('button');
  await expect(tabletopToggle).toHaveCount(1);
  await tabletopToggle.click();

  await settings.click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await resumeIfNeeded(page);
  for (const column of [3, 2, 3, 2, 4]) {
    await page.getByTestId(`board-column-${column}`).click();
  }
  await expect(page.getByTestId('board-cell-5-3')).toHaveAttribute('data-player', '1');
  await cleanScreenshot(page, '07-tabletop.png');
});

test('captures a clean Arabic RTL victory state', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/ar');

  const settings = await selectPvp(page);
  await settings.click();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.getByTestId('pause-toggle').click();

  for (const column of [0, 1, 0, 1, 0, 1, 0]) {
    await page.getByTestId(`board-column-${column}`).click();
  }

  await expect(page.getByRole('button', { name: '\u0627\u0644\u0639\u0628 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649' })).toBeVisible();
  await cleanScreenshot(page, '06-arabic-victory.png');
});
