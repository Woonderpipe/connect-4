import { expect, test } from '@playwright/test';

test.describe('open-source license routes', () => {
  for (const [locale, route] of [['de', '/de/open-source'], ['en', '/open-source']] as const) {
    test(`${locale} route exposes project and dependency attribution`, async ({ page }) => {
      await page.goto(route);

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('Apache-2.0', { exact: true }).first()).toBeVisible();
      await expect(page.locator('[data-license-entry]').first()).toBeVisible();
      await expect(page.getByText('MIT', { exact: true }).first()).toBeVisible();
      await expect(page.getByText(/Android|أندرويد/, { exact: true }).first()).toBeVisible();
    });
  }

  test('search filters the rendered catalog', async ({ page }) => {
    await page.goto('/open-source');
    const search = page.getByRole('searchbox');
    await expect(search).toHaveAttribute('data-search-ready', 'true');
    await search.fill('react');
    await search.dispatchEvent('input');

    await expect(page.locator('[data-license-entry]:visible').first()).toContainText('react');
    await expect(page.locator('[data-license-entry]:visible')).not.toHaveCount(0);

    await search.fill('does-not-exist');
    await search.dispatchEvent('input');
    await expect(page.locator('[data-license-entry]:visible')).toHaveCount(0);
    await expect(page.getByText('No matching components found.')).toBeVisible();
  });
});
