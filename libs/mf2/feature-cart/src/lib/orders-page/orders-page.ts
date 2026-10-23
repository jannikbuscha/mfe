import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventBus } from '@mfe/shared/data-access-event-bus';
import { EuroPipe, Panel } from '@mfe/shared/ui';
import { OrderSummary, summarizeOrder } from '../order-summary';

// Must stay <= the history depth the registry guarantees per stream: with
// { maxEvents: 50, removePercentage: 0.5 } (apps/shell/src/main.ts) a trim
// leaves only 25 events.
export const MAX_ORDERS = 20;

/**
 * Order history built from the `cart.checked-out` stream. The registry
 * replays up to {@link MAX_ORDERS} past events, so orders placed before this
 * page was opened (e.g. from the dashboard widget) are listed too.
 */
@Component({
  selector: 'mf2-orders-page',
  imports: [EuroPipe, Panel, RouterLink],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  host: { 'data-testid': 'orders-page' },
})
export class OrdersPage {
  private readonly checkouts = inject(EventBus).history('cart.checked-out', {
    limit: MAX_ORDERS,
  });

  protected readonly maxOrders = MAX_ORDERS;

  // `history()` is oldest first; the page lists the newest order on top.
  protected readonly orders = computed<OrderSummary[]>(() =>
    this.checkouts()
      .map(({ data }) => summarizeOrder(data))
      .reverse(),
  );
}
