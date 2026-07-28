import { expect, test } from '@playwright/test';

test('analytics is disabled when no Umami configuration is provided', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('script[data-website-id]')).toHaveCount(0);
  await expect(page.locator('script[src*="google-analytics"], script[src*="googletagmanager"]')).toHaveCount(0);
});

test('privacy routes expose English and German policy text', async ({ page }) => {
  await page.goto('/de/privacy');
  await expect(page.getByRole('heading', { name: 'Datenschutz, klar erklärt' })).toBeVisible();

  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();

  await page.goto('/ar/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
});