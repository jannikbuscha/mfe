import type { EnvironmentProviders, Provider } from '@angular/core';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type {
  MfeEventRegistry,
  MfeEvents,
  MfeEventType,
} from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';

/** A fresh, page-independent registry plus the provider that injects it. */
export function testRegistry(): {
  registry: MfeEventRegistry;
  provider: Provider | EnvironmentProviders;
} {
  const registry: MfeEventRegistry = createRegistry({ maxEvents: 10 })();
  return {
    registry,
    provider: { provide: EVENT_REGISTRY, useValue: registry },
  };
}

/** Collects the payloads of all events of `type` published from now on. */
export function recordEvents<K extends MfeEventType>(
  registry: MfeEventRegistry,
  type: K,
): MfeEvents[K][] {
  const events: MfeEvents[K][] = [];
  registry.on(type, ({ data }) => events.push(data), { replay: 0 });
  return events;
}

/** Normalizes whitespace (incl. the non-breaking space `Intl` emits). */
export function text(element: Element | null | undefined): string {
  return (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function byTestId<T extends HTMLElement = HTMLElement>(
  root: Element | null | undefined,
  testId: string,
): T | null {
  return root?.querySelector<T>(`[data-testid="${testId}"]`) ?? null;
}
