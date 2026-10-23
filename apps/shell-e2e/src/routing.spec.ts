import { expect, test } from '@playwright/test';

// Every test starts with page.goto(), i.e. with a fresh event registry.
test.describe('Routing', () => {
  test('navigates through the catalog of MF1', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Dashboard · MFE Shell');

    await page.getByTestId('nav-mf1').click();
    await expect(page).toHaveURL(/\/mf1$/);
    await expect(page.getByTestId('catalog-page')).toBeVisible();
    await expect(page.getByTestId('nav-mf1')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page).toHaveTitle('Katalog · MFE Shell');

    await page.getByTestId('details-cappuccino').click();
    await expect(page).toHaveURL(/\/mf1\/cappuccino$/);
    const detail = page.getByTestId('product-detail');
    await expect(detail.getByRole('heading', { level: 2 })).toHaveText(
      'Cappuccino',
    );
    // The remote titles its own pages; the shell appends its name.
    await expect(page).toHaveTitle('Cappuccino · MFE Shell');

    await detail.getByTestId('add-cappuccino').click();
    await expect(page.getByTestId('cart-badge')).toHaveText('1');

    await detail.getByTestId('back-to-catalog').click();
    await expect(page).toHaveURL(/\/mf1$/);
    await expect(page.getByTestId('catalog-page')).toBeVisible();
  });

  // In the shell all MFs share one CartStore (a singleton through the shared
  // mappings), so this checks the shared cart, not the registry's replay.
  test('MF2 loaded later shows the cart filled in MF1', async ({ page }) => {
    await page.goto('/mf1/cappuccino');
    await page
      .getByTestId('product-detail')
      .getByTestId('add-cappuccino')
      .click();
    await expect(page.getByTestId('cart-badge')).toHaveText('1');

    await page.getByTestId('nav-mf2').click();

    await expect(page).toHaveURL(/\/mf2$/);
    const cart = page.getByTestId('cart-page');
    await expect(cart.getByTestId('cart-line-cappuccino')).toBeVisible();
    await expect(cart.getByTestId('qty-cappuccino')).toHaveText('1');
  });

  test('a widget created after an event still receives it (state replay)', async ({
    page,
  }) => {
    await page.goto('/mf1/cappuccino');
    // Rendered in the same change detection that emits the selection.
    await expect(
      page.getByTestId('product-detail').getByRole('heading', { level: 2 }),
    ).toHaveText('Cappuccino');

    // The MF2 widget subscribes to catalog.product-selected only now.
    await page.getByTestId('nav-dashboard').click();

    await expect(
      page.getByTestId('mf2-widget').getByTestId('last-selected'),
    ).toContainText('Cappuccino');
  });

  test('the orders page lists orders placed before it was opened (bounded backfill)', async ({
    page,
  }) => {
    await page.goto('/mf1');
    await page.getByTestId('catalog-page').getByTestId('add-espresso').click();
    await page.getByTestId('nav-mf2').click();
    await page.getByTestId('cart-page').getByTestId('checkout').click();
    const confirmation = await page
      .getByTestId('order-confirmation')
      .innerText();

    await page.getByTestId('orders-link').click();

    await expect(page).toHaveURL(/\/mf2\/orders$/);
    const orders = page.getByTestId('orders-page');
    const entries = orders.locator('[data-testid^="order-"]');
    await expect(entries).toHaveCount(1);
    // The listed order is the one that was just placed.
    const testId = String(await entries.getAttribute('data-testid'));
    expect(testId).toMatch(/^order-.+/);
    expect(confirmation).toContain(testId.replace(/^order-/, ''));
    await expect(entries).toContainText('2,40');
    await expect(orders.getByTestId('orders-empty')).toBeHidden();
  });

  test('deep links into a remote work', async ({ page }) => {
    await page.goto('/mf2/orders');

    await expect(page.getByTestId('orders-page')).toBeVisible();
    await expect(page).toHaveTitle('Bestellungen · MFE Shell');
    await expect(page.getByTestId('orders-empty')).toHaveText(
      'Noch keine Bestellungen.',
    );
    await expect(page.getByTestId('nav-orders')).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByTestId('nav-mf2')).not.toHaveAttribute(
      'aria-current',
      'page',
    );

    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL(/\/mf2$/);
    await expect(page.getByTestId('cart-page')).toBeVisible();
  });

  test('unknown paths redirect to the dashboard', async ({ page }) => {
    await page.goto('/does-not-exist');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('dashboard')).toBeVisible();
    await expect(page).toHaveTitle('Dashboard · MFE Shell');
  });
});
