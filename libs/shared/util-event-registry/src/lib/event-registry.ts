import type {
  NFEventData,
  NFEventRegistry,
  NFEventUnsubscribe,
} from '@softarc/native-federation-orchestrator/registry';
import type {
  MfeEvents,
  MfeEventType,
  MfeResources,
  MfeResourceType,
} from './contracts';

declare global {
  interface Window {
    /**
     * Created in `main.ts` of the shell (or of a remote that is served
     * standalone) before `initFederation` runs.
     */
    __NF_REGISTRY__?: NFEventRegistry;
  }
}

export interface ReplayOptions {
  /**
   * How many past events to deliver on subscribe: `1` (default) for state
   * channels, `0` for "only new events", `N` for a bounded backfill.
   */
  replay?: number;
}

/**
 * `NFEventRegistry` narrowed to the event names and payloads of
 * {@link MfeEvents} and {@link MfeResources}.
 */
export interface MfeEventRegistry {
  register<K extends MfeResourceType>(
    type: K,
    resource:
      MfeResources[K] | (() => MfeResources[K] | Promise<MfeResources[K]>),
  ): Promise<void>;
  onReady<K extends MfeResourceType>(
    type: K,
    callback: (value: MfeResources[K]) => void,
  ): NFEventUnsubscribe;
  emit<K extends MfeEventType>(type: K, data: MfeEvents[K]): void;
  update<K extends MfeEventType>(
    type: K,
    reducer: (current: MfeEvents[K] | undefined) => MfeEvents[K],
  ): void;
  on<K extends MfeEventType>(
    type: K,
    callback: (event: NFEventData<MfeEvents[K]>) => void,
    opts?: ReplayOptions,
  ): NFEventUnsubscribe;
  clear(type?: MfeEventType | MfeResourceType): void;
}

/**
 * Returns the page-wide registry. Throws instead of failing later with
 * "Cannot read properties of undefined" when `main.ts` did not create it.
 */
export function eventRegistry(): MfeEventRegistry {
  const registry = globalThis.window?.__NF_REGISTRY__;
  if (!registry) {
    throw new Error(
      'window.__NF_REGISTRY__ does not exist. Create it with createRegistry() ' +
        'in main.ts before initFederation() runs.',
    );
  }
  return registry;
}
