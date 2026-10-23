import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartStore } from '@mfe/shared/data-access-cart';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type {
  CartItem,
  MfeEventRegistry,
  Order,
} from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { CartView } from './cart-view';

const espresso: CartItem = {
  productId: 'espresso',
  name: 'Espresso',
  price: 2.4,
  quantity: 2,
};
const bagel: CartItem = {
  productId: 'bagel',
  name: 'Bagel',
  price: 2.6,
  quantity: 1,
};

describe('CartView', () => {
  let registry: MfeEventRegistry;
  let fixture: ComponentFixture<CartView>;

  const query = (testId: string) =>
    fixture.nativeElement.querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLElement | null;
  const text = (testId: string) => query(testId)?.textContent?.trim();
  const click = async (testId: string) => {
    query(testId)?.click();
    await fixture.whenStable();
  };
  const cart = () => TestBed.inject(CartStore).items();

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 10 })();
    TestBed.configureTestingModule({
      providers: [{ provide: EVENT_REGISTRY, useValue: registry }],
    });
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(CartView);
    await fixture.whenStable();
  }

  it('replays a cart that was published before the view existed', async () => {
    registry.update('cart.items', () => [espresso, bagel]);

    await render();

    expect(query('cart-line-espresso')).not.toBeNull();
    expect(query('cart-line-bagel')).not.toBeNull();
    expect(text('qty-espresso')).toBe('2');
    expect(text('cart-total')).toMatch(/^7,40\s€$/);
    expect(query('cart-empty')).toBeNull();
  });

  it('follows cart changes published by other micro frontends', async () => {
    await render();
    expect(text('cart-empty')).toBe('Der Warenkorb ist leer.');
    expect((query('checkout') as HTMLButtonElement).disabled).toBe(true);

    registry.update('cart.items', () => [espresso]);
    await fixture.whenStable();

    expect(text('qty-espresso')).toBe('2');
    expect((query('checkout') as HTMLButtonElement).disabled).toBe(false);
  });

  it('increments, decrements and removes lines through the cart channel', async () => {
    registry.update('cart.items', () => [espresso, bagel]);
    await render();

    await click('inc-espresso');
    expect(text('qty-espresso')).toBe('3');
    expect(cart().find((i) => i.productId === 'espresso')).toEqual({
      ...espresso,
      quantity: 3,
    });

    await click('dec-espresso');
    await click('dec-espresso');
    expect(text('qty-espresso')).toBe('1');

    await click('dec-espresso');
    expect(query('cart-line-espresso')).toBeNull();

    await click('remove-bagel');
    expect(query('cart-line-bagel')).toBeNull();
    expect(query('cart-empty')).not.toBeNull();
    expect(cart()).toEqual([]);
  });

  it('publishes cart.checked-out on checkout and confirms the order', async () => {
    const orders: Order[] = [];
    registry.on('cart.checked-out', ({ data }) => orders.push(data), {
      replay: 0,
    });
    registry.update('cart.items', () => [espresso, bagel]);
    await render();

    await click('checkout');

    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ items: [espresso, bagel], total: 7.4 });
    expect(text('order-confirmation')).toContain(orders[0].orderId);
    expect(text('order-confirmation')).toContain('3 Artikel');
    expect(query('cart-empty')).not.toBeNull();
    expect((query('checkout') as HTMLButtonElement).disabled).toBe(true);
  });

  it('hides the confirmation once the cart is filled again', async () => {
    registry.update('cart.items', () => [espresso]);
    await render();
    await click('checkout');
    expect(query('order-confirmation')).not.toBeNull();

    registry.update('cart.items', () => [bagel]);
    await fixture.whenStable();
    expect(query('order-confirmation')).toBeNull();

    registry.update('cart.items', () => []);
    await fixture.whenStable();
    expect(query('order-confirmation')).toBeNull();
  });

  it('hides unit prices in the compact layout', async () => {
    registry.update('cart.items', () => [espresso]);
    await render();
    expect(text('cart-line-espresso')).toContain('/ Stück');

    fixture.componentRef.setInput('compact', true);
    await fixture.whenStable();

    expect(text('cart-line-espresso')).not.toContain('/ Stück');
    expect(fixture.nativeElement.classList).toContain('compact');
  });
});
