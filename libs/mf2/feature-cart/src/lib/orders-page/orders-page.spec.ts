import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartStore } from '@mfe/shared/data-access-cart';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type { MfeEventRegistry, Order } from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { OrdersPage } from './orders-page';

const order = (orderId: string, placedAt: number): Order => ({
  orderId,
  placedAt,
  total: 7.4,
  items: [
    { productId: 'espresso', name: 'Espresso', price: 2.4, quantity: 2 },
    { productId: 'bagel', name: 'Bagel', price: 2.6, quantity: 1 },
  ],
});

describe('OrdersPage', () => {
  let registry: MfeEventRegistry;
  let fixture: ComponentFixture<OrdersPage>;

  const query = (testId: string) =>
    fixture.nativeElement.querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLElement | null;
  const orderIds = () =>
    [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid^="order-"]',
      ),
    ].map((el) => el.getAttribute('data-testid'));

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 50 })();
    TestBed.configureTestingModule({
      providers: [
        { provide: EVENT_REGISTRY, useValue: registry },
        provideRouter([]),
      ],
    });
  });

  async function render(): Promise<void> {
    fixture = TestBed.createComponent(OrdersPage);
    await fixture.whenStable();
  }

  it('shows the empty state without orders', async () => {
    await render();

    expect(fixture.nativeElement.getAttribute('data-testid')).toBe(
      'orders-page',
    );
    expect(query('orders-empty')?.textContent?.trim()).toBe(
      'Noch keine Bestellungen.',
    );
    expect(query('cart-link')?.getAttribute('href')).toBe('/');
  });

  it('backfills orders placed before the page was opened, newest first', async () => {
    registry.emit('cart.checked-out', order('ORD-1', 1_000));
    registry.emit('cart.checked-out', order('ORD-2', 2_000));

    await render();

    expect(orderIds()).toEqual(['order-ORD-2', 'order-ORD-1']);
    const entry = query('order-ORD-2')?.textContent ?? '';
    expect(entry).toContain('ORD-2');
    expect(entry).toContain('3 Artikel');
    expect(entry).toMatch(/7,40\s€/);
    expect(query('orders-empty')).toBeNull();
  });

  it('adds new checkouts on top', async () => {
    registry.emit('cart.checked-out', order('ORD-1', 1_000));
    await render();

    const store = TestBed.inject(CartStore);
    store.add({ productId: 'espresso', name: 'Espresso', price: 2.4 });
    const placed = store.checkout();
    await fixture.whenStable();

    expect(orderIds()).toEqual([`order-${placed?.orderId}`, 'order-ORD-1']);
  });

  it('lists an order only once when it is emitted during the backfill', async () => {
    registry.emit('cart.checked-out', order('ORD-1', 1_000));
    fixture = TestBed.createComponent(OrdersPage);
    registry.emit('cart.checked-out', order('ORD-2', 2_000));
    await fixture.whenStable();

    expect(orderIds()).toEqual(['order-ORD-2', 'order-ORD-1']);
  });

  it('keeps at most 20 orders', async () => {
    for (let i = 1; i <= 25; i++) {
      registry.emit('cart.checked-out', order(`ORD-${i}`, i));
    }

    await render();

    expect(orderIds()).toHaveLength(20);
    expect(orderIds()[0]).toBe('order-ORD-25');
  });
});
