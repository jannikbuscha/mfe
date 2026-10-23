import { TestBed } from '@angular/core/testing';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type { MfeEventRegistry, Order } from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { CartStore } from './cart-store';

const apple = { productId: 'apple', name: 'Apple', price: 0.5 };
const pear = { productId: 'pear', name: 'Pear', price: 0.75 };

describe('CartStore', () => {
  let registry: MfeEventRegistry;
  let store: CartStore;

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 10 })();
    TestBed.configureTestingModule({
      providers: [{ provide: EVENT_REGISTRY, useValue: registry }],
    });
    store = TestBed.inject(CartStore);
  });

  it('adds products and increases the quantity of existing lines', () => {
    store.add(apple);
    store.add(apple);
    store.add(pear);

    expect(store.items()).toEqual([
      { ...apple, quantity: 2 },
      { ...pear, quantity: 1 },
    ]);
    expect(store.itemCount()).toBe(3);
    expect(store.total()).toBe(1.75);
    expect(store.quantityOf('apple')).toBe(2);
  });

  it('decrements and drops lines that reach zero', () => {
    store.add(apple);
    store.add(apple);
    store.decrement('apple');
    expect(store.quantityOf('apple')).toBe(1);

    store.decrement('apple');
    expect(store.items()).toEqual([]);
  });

  it('removes a line completely', () => {
    store.add(apple);
    store.add(pear);
    store.remove('apple');

    expect(store.items().map((i) => i.productId)).toEqual(['pear']);
  });

  it('sees cart changes published by other micro frontends', () => {
    registry.update('cart.items', () => [{ ...pear, quantity: 4 }]);

    expect(store.itemCount()).toBe(4);
  });

  it('publishes cart.checked-out and empties the cart on checkout', () => {
    const orders: Order[] = [];
    registry.on('cart.checked-out', ({ data }) => orders.push(data), {
      replay: 0,
    });
    store.add(apple);

    const order = store.checkout();

    expect(order?.total).toBe(0.5);
    expect(orders).toEqual([order]);
    expect(store.items()).toEqual([]);
  });

  it('does not publish an order for an empty cart', () => {
    const listener = vi.fn();
    registry.on('cart.checked-out', listener, { replay: 0 });

    expect(store.checkout()).toBeUndefined();
    expect(listener).not.toHaveBeenCalled();
  });
});
