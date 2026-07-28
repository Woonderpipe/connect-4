import { expect, test } from '@playwright/test';

test('uses the system preference and keeps an explicit theme across legal navigation', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ colorScheme: 'dark', viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();

  try {
    await page.goto(baseURL!);
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByTestId('settings-toggle').click();
    await page.getByTestId('theme-light').click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    await page.getByTestId('theme-dark').click();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy\/?$/);
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('link', { name: 'Back to the game' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByTestId('settings-toggle').click();
    await page.getByTestId('theme-system').click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  } finally {
    await context.close();
  }
});