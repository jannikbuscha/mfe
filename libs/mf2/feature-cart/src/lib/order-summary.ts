import type { Order } from '@mfe/shared/util-event-registry';

export interface OrderSummary {
  orderId: string;
  placedAt: number;
  /** `placedAt` formatted for display, e.g. `23.10.26, 14:03:12`. */
  time: string;
  itemCount: number;
  total: number;
}

// Intl instead of DatePipe: the host application decides whether Angular
// locale data is registered, and a remote must not depend on that.
const timeFormat = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'short',
  timeStyle: 'medium',
});

export function summarizeOrder(order: Order): OrderSummary {
  return {
    orderId: order.orderId,
    placedAt: order.placedAt,
    time: timeFormat.format(order.placedAt),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.total,
  };
}
