import { expect, type Locator, test } from '@playwright/test';

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`${locator} is not visible`);
  }
  return box;
}

// Every test starts with page.goto(), i.e. with a fresh event registry.
test.describe('Dashboard', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('dashboard')).toBeVisible();
  });

  test('renders both remote widgets side by side', async ({ page }) => {
    await expect(
      page.getByTestId('slot-mf1').getByTestId('mf1-widget'),
    ).toBeVisible();
    await expect(
      page.getByTestId('slot-mf2').getByTestId('mf2-widget'),
    ).toBeVisible();

    const mf1 = await boxOf(page.getByTestId('slot-mf1'));
    const mf2 = await boxOf(page.getByTestId('slot-mf2'));
    expect(mf1.x + mf1.width).toBeLessThanOrEqual(mf2.x);
    expect(Math.abs(mf1.y - mf2.y)).toBeLessThan(1);
  });

  test('MF1 → MF2: a product added in the catalog shows up in the cart', async ({
    page,
  }) => {
    const mf1 = page.getByTestId('mf1-widget');
    const mf2 = page.getByTestId('mf2-widget');
    await expect(mf2.getByTestId('cart-empty')).toBeVisible();
    await expect(page.getByTestId('cart-badge')).toHaveText('0');

    await mf1.getByTestId('add-espresso').click();

    await expect(mf2.getByTestId('cart-line-espresso')).toBeVisible();
    await expect(mf2.getByTestId('qty-espresso')).toHaveText('1');
    await expect(mf2.getByTestId('cart-empty')).toBeHidden();
    await expect(page.getByTestId('cart-badge')).toHaveText('1');
    await expect(mf1.getByTestId('in-cart-espresso')).toContainText(
      'Im Warenkorb: 1',
    );
  });

  test('MF2 → MF1: quantity changes in the cart show up in the catalog', async ({
    page,
  }) => {
    const mf1 = page.getByTestId('mf1-widget');
    const mf2 = page.getByTestId('mf2-widget');
    await mf1.getByTestId('add-espresso').click();
    await expect(mf2.getByTestId('qty-espresso')).toHaveText('1');

    await mf2.getByTestId('inc-espresso').click();
    await expect(mf2.getByTestId('qty-espresso')).toHaveText('2');
    await expect(mf1.getByTestId('in-cart-espresso')).toContainText(
      'Im Warenkorb: 2',
    );
    await expect(page.getByTestId('cart-badge')).toHaveText('2');

    await mf2.getByTestId('dec-espresso').click();
    await expect(mf1.getByTestId('in-cart-espresso')).toContainText(
      'Im Warenkorb: 1',
    );

    await mf2.getByTestId('dec-espresso').click();
    await expect(mf2.getByTestId('cart-line-espresso')).toBeHidden();
    await expect(mf2.getByTestId('cart-empty')).toBeVisible();
    await expect(mf1.getByTestId('in-cart-espresso')).toBeHidden();
    await expect(page.getByTestId('cart-badge')).toHaveText('0');
  });

  test('MF1 → MF2: the product selected in the catalog is shown in the cart widget', async ({
    page,
  }) => {
    const mf2 = page.getByTestId('mf2-widget');
    await expect(mf2.getByTestId('last-selected')).toBeHidden();

    await page
      .getByTestId('mf1-widget')
      .getByTestId('select-croissant')
      .click();

    await expect(mf2.getByTestId('last-selected')).toContainText('Croissant');
    await expect(
      page
        .getByTestId('event-monitor')
        .getByTestId('event-log-entry')
        .filter({ hasText: 'catalog.product-selected' }),
    ).toHaveCount(1);
  });

  test('checkout publishes the order', async ({ page }) => {
    const mf1 = page.getByTestId('mf1-widget');
    const mf2 = page.getByTestId('mf2-widget');
    await expect(mf2.getByTestId('checkout')).toBeDisabled();

    await mf1.getByTestId('add-espresso').click();
    await mf1.getByTestId('add-croissant').click();
    await expect(mf2.getByTestId('cart-total')).toContainText('4,50');

    await mf2.getByTestId('checkout').click();

    await expect(page.getByTestId('order-confirmation')).toBeVisible();
    await expect(mf2.getByTestId('cart-empty')).toBeVisible();
    await expect(mf2.getByTestId('checkout')).toBeDisabled();
    await expect(page.getByTestId('cart-badge')).toHaveText('0');
    await expect(
      page
        .getByTestId('event-monitor')
        .getByTestId('event-log-entry')
        .filter({ hasText: 'cart.checked-out' }),
    ).toHaveCount(1);
  });
});
