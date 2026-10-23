import { Component, computed, inject, Signal } from '@angular/core';
import { EventBus } from '@mfe/shared/data-access-event-bus';
import { EventLog, EventLogEntry, Panel } from '@mfe/shared/ui';
import type { MfeEventType } from '@mfe/shared/util-event-registry';

// Must stay <= the history depth the registry guarantees: with the config in
// apps/shell/src/main.ts that is maxEvents - ceil(maxEvents * removePercentage)
// = 25, because a full registry drops half of its events at once.
const LIMIT = 20;

type EventHistory = Signal<readonly { timestamp: number; data: unknown }[]>;

/** Live view of the event streams of the registry, newest event first. */
@Component({
  selector: 'shell-event-monitor',
  imports: [EventLog, Panel],
  templateUrl: './event-monitor.html',
  styleUrl: './event-monitor.scss',
})
export class EventMonitor {
  private readonly bus = inject(EventBus);

  protected readonly limit = LIMIT;

  // `satisfies` makes the compiler point here when the contract gets a new event.
  private readonly streams = {
    'cart.items': this.bus.history('cart.items', { limit: LIMIT }),
    'cart.checked-out': this.bus.history('cart.checked-out', { limit: LIMIT }),
    'catalog.product-selected': this.bus.history('catalog.product-selected', {
      limit: LIMIT,
    }),
  } satisfies Record<MfeEventType, EventHistory>;

  protected readonly entries = computed<EventLogEntry[]>(() =>
    Object.entries(this.streams)
      .flatMap(([type, history]: [string, EventHistory]) =>
        // Newest first within a stream, so equal timestamps keep their order
        // in the stable sort below.
        history()
          .map(({ timestamp, data }) => ({ type, timestamp, data }))
          .reverse(),
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, LIMIT),
  );
}
