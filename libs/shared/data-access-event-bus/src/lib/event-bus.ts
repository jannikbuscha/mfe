import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  Injector,
  Signal,
  signal,
} from '@angular/core';
import type { NFEventData } from '@softarc/native-federation-orchestrator/registry';
import {
  eventRegistry,
  MfeEventRegistry,
  MfeEvents,
  MfeEventType,
  ReplayOptions,
} from '@mfe/shared/util-event-registry';
import { Observable } from 'rxjs';

/**
 * The registry the {@link EventBus} talks to. Defaults to
 * `window.__NF_REGISTRY__`; tests provide their own `createRegistry()`.
 */
export const EVENT_REGISTRY = new InjectionToken<MfeEventRegistry>(
  'EVENT_REGISTRY',
  { providedIn: 'root', factory: () => eventRegistry() },
);

export interface SubscriptionOptions {
  /** Ties the subscription to this injector's lifetime instead of the caller's. */
  injector?: Injector;
}

export interface HistoryOptions extends SubscriptionOptions {
  /** Past events to replay on subscribe and maximum number of entries kept. */
  limit: number;
}

/**
 * Angular-friendly facade over the NF event registry: signals for templates,
 * an Observable for RxJS code, and subscriptions that end with the component
 * (or service) that created them.
 */
@Injectable({ providedIn: 'root' })
export class EventBus {
  private readonly registry = inject(EVENT_REGISTRY);

  emit<K extends MfeEventType>(type: K, data: MfeEvents[K]): void {
    this.registry.emit(type, data);
  }

  update<K extends MfeEventType>(
    type: K,
    reducer: (current: MfeEvents[K] | undefined) => MfeEvents[K],
  ): void {
    this.registry.update(type, reducer);
  }

  /**
   * Latest value of a state channel. Replays the current value on subscribe,
   * so the signal is filled even if the event was published before this
   * micro frontend was loaded.
   */
  state<K extends MfeEventType>(
    type: K,
    options: SubscriptionOptions = {},
  ): Signal<MfeEvents[K] | undefined> {
    const destroyRef = resolveDestroyRef(this.state, options);
    const value = signal<MfeEvents[K] | undefined>(undefined);
    let receivedLive = false;
    const stopLive = this.registry.on(
      type,
      ({ data }) => {
        receivedLive = true;
        value.set(data);
      },
      { replay: 0 },
    );
    // The registry replays in a microtask. A live event delivered before that
    // is newer than the replayed value, which then must not overwrite it.
    const stopReplay = this.registry.on(
      type,
      ({ data }) => {
        if (!receivedLive) {
          value.set(data);
        }
      },
      { replay: 1 },
    );
    queueMicrotask(stopReplay);
    destroyRef.onDestroy(() => {
      stopLive();
      stopReplay();
    });
    return value.asReadonly();
  }

  /**
   * The last `limit` events of a stream (oldest first), kept up to date.
   * Events published before the subscription are backfilled from the
   * registry's history, which keeps at most `maxEvents` per stream.
   */
  history<K extends MfeEventType>(
    type: K,
    options: HistoryOptions,
  ): Signal<readonly NFEventData<MfeEvents[K]>[]> {
    type Event = NFEventData<MfeEvents[K]>;
    const destroyRef = resolveDestroyRef(this.history, options);
    const { limit } = options;
    const events = signal<readonly Event[]>([]);

    // The registry delivers the backfill in a microtask. Events emitted before
    // it runs arrive live first and then again at the end of the backfill, so
    // both are collected separately and merged once the backfill is through.
    let pending: { live: Event[]; backfill?: Event[] } | undefined = {
      live: [],
    };
    // Queued before `on()`, so it runs right before the registry's replay.
    queueMicrotask(() => pending && (pending.backfill = []));
    const unsubscribe = this.registry.on(
      type,
      (event) => {
        if (pending) {
          (pending.backfill ?? pending.live).push(event);
        } else {
          events.update((list) => [...list, event].slice(-limit));
        }
      },
      { replay: limit },
    );
    // Queued after `on()`, so it runs right after the registry's replay.
    queueMicrotask(() => {
      if (pending) {
        const { backfill = [], live } = pending;
        pending = undefined;
        events.set(mergeBackfill(backfill, live).slice(-limit));
      }
    });

    destroyRef.onDestroy(unsubscribe);
    return events.asReadonly();
  }

  /** Cold Observable: subscribes to the registry per subscriber. */
  on$<K extends MfeEventType>(
    type: K,
    options: ReplayOptions = {},
  ): Observable<NFEventData<MfeEvents[K]>> {
    return new Observable((subscriber) =>
      this.registry.on(type, (event) => subscriber.next(event), options),
    );
  }
}

/**
 * The backfill is the registry's history, oldest first. Live events that the
 * registry had already stored when it ran the backfill are also its last
 * entries: find that overlap and append only the live events after it.
 */
function mergeBackfill<T>(
  backfill: readonly NFEventData<T>[],
  live: readonly NFEventData<T>[],
): NFEventData<T>[] {
  if (backfill.length === 0) {
    return [...live];
  }
  for (let end = live.length; end > 0; end--) {
    const overlap = Math.min(end, backfill.length);
    const tail = backfill.slice(backfill.length - overlap);
    if (tail.every((event, i) => sameEvent(event, live[end - overlap + i]))) {
      return [...backfill, ...live.slice(end)];
    }
  }
  return [...backfill, ...live];
}

/** Replayed events are structured clones, so compare by value. */
function sameEvent<T>(a: NFEventData<T>, b: NFEventData<T>): boolean {
  return (
    a.timestamp === b.timestamp &&
    JSON.stringify(a.data) === JSON.stringify(b.data)
  );
}

function resolveDestroyRef(
  caller: (...args: never[]) => unknown,
  { injector }: SubscriptionOptions,
): DestroyRef {
  if (injector) {
    return injector.get(DestroyRef);
  }
  assertInInjectionContext(caller);
  return inject(DestroyRef);
}
