import { expect, test, type Browser, type Page } from '@playwright/test';
import { buildAppInviteUrl, buildWebInviteUrl, parseInviteGameCode } from '../lib/invite-links';

const mobileContextOptions = {
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
} as const;

const newPlayerPage = async (browser: Browser, baseURL: string) => {
  const context = await browser.newContext(mobileContextOptions);
  const page = await context.newPage();
  await page.goto(baseURL);
  return { context, page };
};

const openOnlinePanel = async (page: Page) => {
  await page.getByTestId('settings-toggle').click();
  const onlineMode = page.getByTestId('mode-online');
  await expect(onlineMode).toBeVisible();
  await onlineMode.scrollIntoViewIfNeeded();
  await onlineMode.click();
  await expect(onlineMode).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('online-create-game')).toBeVisible();
};

const createOnlineGame = async (page: Page) => {
  await openOnlinePanel(page);
  await page.getByTestId('online-create-game').click();
  const code = page.getByTestId('online-game-code');
  await expect(code).toBeVisible();
  await expect.poll(async () => (await code.textContent())?.trim() || '').not.toBe('');
  return ((await code.textContent()) || '').trim();
};

const joinOnlineGame = async (page: Page, code: string) => {
  await openOnlinePanel(page);
  await page.getByTestId('online-join-code').fill(code);
  await page.getByTestId('online-join-game').click();
  await expect(page.getByTestId('online-game-code')).toHaveText(code);
};

const expectConnected = async (page: Page) => {
  await expect(page.getByTestId('online-opponent-status')).toHaveAttribute('data-connected', 'true');
};

const expectCell = async (page: Page, row: number, col: number, player: string) => {
  await expect(page.getByTestId(`board-cell-${row}-${col}`)).toHaveAttribute('data-player', player);
};

test.beforeEach(async ({ request }) => {
  const response = await request.post('/api/__test-online/reset');
  expect(response.ok()).toBe(true);
});

test('creates, joins, and synchronizes online moves across two mobile browser contexts', async ({ browser, baseURL }) => {
  const playerOne = await newPlayerPage(browser, baseURL!);
  const playerTwo = await newPlayerPage(browser, baseURL!);

  try {
    const code = await createOnlineGame(playerOne.page);
    await joinOnlineGame(playerTwo.page, code);

    await expectConnected(playerOne.page);
    await expectConnected(playerTwo.page);

    await playerOne.page.getByTestId('board-column-3').click();
    await expectCell(playerOne.page, 5, 3, '1');
    await expectCell(playerTwo.page, 5, 3, '1');

    await playerOne.page.getByTestId('board-column-4').click();
    await playerOne.page.waitForTimeout(250);
    await expectCell(playerOne.page, 5, 4, '');
    await expectCell(playerTwo.page, 5, 4, '');

    await playerTwo.page.getByTestId('board-column-4').click();
    await expectCell(playerOne.page, 5, 4, '2');
    await expectCell(playerTwo.page, 5, 4, '2');
  } finally {
    await Promise.allSettled([playerOne.context.close(), playerTwo.context.close()]);
  }
});

test('joins automatically from an invite link in a fresh mobile browser context', async ({ browser, baseURL }) => {
  const playerOne = await newPlayerPage(browser, baseURL!);
  const playerTwoContext = await browser.newContext(mobileContextOptions);
  const playerTwoPage = await playerTwoContext.newPage();

  try {
    const code = await createOnlineGame(playerOne.page);
    await playerTwoPage.goto(`${baseURL}/?game=${encodeURIComponent(code)}`);
    await playerTwoPage.getByTestId('settings-toggle').click();

    await expect(playerTwoPage.getByTestId('online-game-code')).toHaveText(code);
    await expectConnected(playerOne.page);
    await expectConnected(playerTwoPage);
  } finally {
    await Promise.allSettled([playerOne.context.close(), playerTwoContext.close()]);
  }
});
test('builds public invite links instead of runtime-local links', () => {
  expect(buildWebInviteUrl('abc-123', { locale: 'de' })).toBe('https://example.com/de?game=abc-123');
  expect(buildWebInviteUrl('abc-123', { locale: 'en' })).toBe('https://example.com/?game=abc-123');
  expect(buildWebInviteUrl('abc-123', { locale: 'ar' })).toBe('https://example.com/ar?game=abc-123');
  expect(buildWebInviteUrl('abc-123', { locale: 'de', siteUrl: 'https://woonderpipe.github.io/connect-four-private' })).toBe('https://woonderpipe.github.io/connect-four-private/de?game=abc-123');
  expect(buildWebInviteUrl('abc-123', { locale: 'de', siteUrl: 'capacitor://localhost' })).toBe('https://example.com/de?game=abc-123');
  expect(buildWebInviteUrl('abc-123', { locale: 'de', siteUrl: 'http://localhost:4444' })).toBe('https://example.com/de?game=abc-123');
  expect(parseInviteGameCode(buildAppInviteUrl('abc-123'))).toBe('abc-123');
});

test('shares the public invite link through the mobile share action', async ({ browser, baseURL }) => {
  const playerOne = await newPlayerPage(browser, baseURL!);

  try {
    await playerOne.page.evaluate(() => {
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (data: ShareData) => {
          (window as Window & { __lastShareData?: ShareData }).__lastShareData = data;
        }
      });
    });

    const code = await createOnlineGame(playerOne.page);
    await playerOne.page.getByTestId('online-share-invite').click();

    await expect.poll(async () => playerOne.page.evaluate(() => {
      return (window as Window & { __lastShareData?: ShareData }).__lastShareData?.url || '';
    })).toBe(`https://example.com/?game=${encodeURIComponent(code)}`);
  } finally {
    await playerOne.context.close();
  }
});
