import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  inject,
  Injector,
  input,
  linkedSignal,
  viewChild,
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

  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly summary =
    viewChild.required<ElementRef<HTMLElement>>('summary');

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
    this.keepFocus(() => this.cart.decrement(item.productId));
  }

  protected remove(item: CartItem): void {
    this.keepFocus(() => this.cart.remove(item.productId));
  }

  protected checkout(): void {
    this.keepFocus(() => {
      const order = this.cart.checkout();
      if (order) {
        this.lastOrder.set(order);
      }
    });
  }

  protected dismissConfirmation(): void {
    this.keepFocus(() => this.lastOrder.set(undefined));
  }

  /**
   * Runs `action`. If that removed or disabled the focused element (line gone,
   * checkout disabled, confirmation closed), focus moves to the summary instead
   * of falling back to `<body>`. The order confirmation is announced by its
   * live region, so it does not need focus.
   */
  private keepFocus(action: () => void): void {
    const focused = this.document.activeElement;
    action();
    afterNextRender(
      () => {
        if (focused && (!focused.isConnected || focused.matches(':disabled'))) {
          this.summary().nativeElement.focus();
        }
      },
      { injector: this.injector },
    );
  }
}
