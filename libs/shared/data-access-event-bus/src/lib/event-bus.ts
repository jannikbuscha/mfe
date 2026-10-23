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
  MfeResources,
  MfeResourceType,
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
    const unsubscribe = this.registry.on(type, ({ data }) => value.set(data), {
      replay: 1,
    });
    destroyRef.onDestroy(unsubscribe);
    return value.asReadonly();
  }

  /** The last `limit` events of a stream (oldest first), kept up to date. */
  history<K extends MfeEventType>(
    type: K,
    options: HistoryOptions,
  ): Signal<readonly NFEventData<MfeEvents[K]>[]> {
    const destroyRef = resolveDestroyRef(this.history, options);
    const { limit } = options;
    const events = signal<readonly NFEventData<MfeEvents[K]>[]>([]);
    // The registry replays in a microtask. An event emitted before that
    // microtask runs arrives live first and then again with the replay, so
    // until the replay is through, drop copies and restore chronological order.
    let replayWindow: Set<string> | undefined = new Set();
    const unsubscribe = this.registry.on(
      type,
      (event) => {
        if (!replayWindow) {
          events.update((list) => [...list, event].slice(-limit));
          return;
        }
        const key = `${event.timestamp}:${JSON.stringify(event.data)}`;
        if (!replayWindow.has(key)) {
          replayWindow.add(key);
          events.update((list) =>
            [...list, event]
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-limit),
          );
        }
      },
      { replay: limit },
    );
    // Queued after the registry's replay microtask, so it runs once that is done.
    queueMicrotask(() => (replayWindow = undefined));
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

  /** Resolves once the resource is registered, immediately if it already is. */
  whenReady<K extends MfeResourceType>(type: K): Promise<MfeResources[K]> {
    return new Promise((resolve) => this.registry.onReady(type, resolve));
  }
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
