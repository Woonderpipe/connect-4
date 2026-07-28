import { expect, test } from '@playwright/test';

test('mobile PvE AI responds after the player drops a chip', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await expect(page.getByTestId('pause-toggle')).toHaveAttribute('title', 'Pause');
  await page.getByTestId('board-column-3').click();

  await expect(page.getByTestId('board-cell-5-3')).toHaveAttribute('data-player', '1');
  await expect(page.locator('[data-player="2"]').first()).toBeVisible({ timeout: 6_000 });
});