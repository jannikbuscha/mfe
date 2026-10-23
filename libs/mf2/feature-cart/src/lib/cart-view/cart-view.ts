import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { CartStore } from '@mfe/shared/data-access-cart';
import { EuroPipe } from '@mfe/shared/ui';
import type { CartItem, Order } from '@mfe/shared/util-event-registry';
import { summarizeOrder } from '../order-summary';

/**
 * Cart lines, total and checkout. Used by the cart page and by the dashboard
 * widget, so both always behave the same.
 */
@Component({
  selector: 'mf2-cart-view',
  imports: [EuroPipe],
  templateUrl: './cart-view.html',
  styleUrl: './cart-view.scss',
  host: { '[class.compact]': 'compact()' },
})
export class CartView {
  /** Denser layout without unit prices, for the dashboard widget. */
  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly cart = inject(CartStore);

  // Resets when the cart switches between empty and filled: the confirmation
  // goes away as soon as anyone (e.g. MF1) starts the next order.
  private readonly lastOrder = linkedSignal<boolean, Order | undefined>({
    source: () => this.cart.items().length > 0,
    computation: () => undefined,
  });

  protected readonly confirmation = computed(() => {
    const order = this.lastOrder();
    return order && summarizeOrder(order);
  });

  protected increment({ productId, name, price }: CartItem): void {
    this.cart.add({ productId, name, price });
  }

  protected decrement(item: CartItem): void {
    this.cart.decrement(item.productId);
  }

  protected remove(item: CartItem): void {
    this.cart.remove(item.productId);
  }

  protected checkout(): void {
    const order = this.cart.checkout();
    if (order) {
      this.lastOrder.set(order);
    }
  }

  protected dismissConfirmation(): void {
    this.lastOrder.set(undefined);
  }
}
