import { expect, test } from '@playwright/test';

const openPvpPowerup = async (page: import('@playwright/test').Page) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.getByTestId('settings-toggle').click();
  await page.getByTestId('mode-pvp').click();
  await expect(page.getByTestId('mode-pvp')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('fun-mode-powerup')).toBeVisible();
  await page.getByTestId('fun-mode-powerup').click();
  await page.getByTestId('settings-toggle').click();
  await page.getByTestId('use-power-toggle').click();
};

test('cell-targeted power-ups expose reachable board-cell targets', async ({ page }) => {
  await openPvpPowerup(page);

  await expect(page.getByTestId('board-cell-target-0-0')).toBeVisible();
  await expect(page.getByTestId('board-cell-target-0-0')).toHaveAttribute('aria-label', /power/i);
});

test('winner modal waits for the winning-line reveal', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.getByTestId('settings-toggle').click();
  await page.getByTestId('mode-pvp').click();
  await expect(page.getByTestId('mode-pvp')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('settings-toggle').click();

  for (const column of [0, 1, 0, 1, 0, 1, 0]) {
    await page.getByTestId(`board-column-${column}`).click();
  }

  await expect(page.getByTestId('winning-line-reveal')).toBeVisible();
  await expect(page.getByTestId('play-again')).toBeHidden();
  await expect(page.getByTestId('play-again')).toBeVisible({ timeout: 12_000 });
});