import { computed, inject, Injectable } from '@angular/core';
import { EventBus } from '@mfe/shared/data-access-event-bus';
import type { CartItem, Order } from '@mfe/shared/util-event-registry';

export type CartProduct = Omit<CartItem, 'quantity'>;

/**
 * The cart lives in the `cart.items` state channel of the event registry, not
 * in this service. Inside the shell all micro frontends share one instance
 * (this library is a shared singleton); a remote served standalone has its
 * own. Mutations go through `update()`, so they always start from the latest
 * value published by anyone.
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly bus = inject(EventBus);

  private readonly state = this.bus.state('cart.items');

  readonly items = computed(() => this.state() ?? []);
  readonly itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly total = computed(() =>
    roundCents(
      this.items().reduce((sum, item) => sum + item.price * item.quantity, 0),
    ),
  );

  quantityOf(productId: string): number {
    return this.items().find((i) => i.productId === productId)?.quantity ?? 0;
  }

  add(product: CartProduct): void {
    this.bus.update('cart.items', (items = []) =>
      items.some((i) => i.productId === product.productId)
        ? items.map((i) =>
            i.productId === product.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...items, { ...product, quantity: 1 }],
    );
  }

  /** Removes one unit; the line disappears when its quantity reaches zero. */
  decrement(productId: string): void {
    this.bus.update('cart.items', (items = []) =>
      items
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  remove(productId: string): void {
    this.bus.update('cart.items', (items = []) =>
      items.filter((i) => i.productId !== productId),
    );
  }

  /**
   * Publishes `cart.checked-out` and empties the cart. Returns `undefined`
   * when the cart is empty.
   */
  checkout(): Order | undefined {
    const items = this.items();
    if (items.length === 0) {
      return undefined;
    }
    const order: Order = {
      orderId: createOrderId(),
      items,
      total: this.total(),
      placedAt: Date.now(),
    };
    this.bus.emit('cart.checked-out', order);
    this.bus.update('cart.items', () => []);
    return order;
  }
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function createOrderId(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}
