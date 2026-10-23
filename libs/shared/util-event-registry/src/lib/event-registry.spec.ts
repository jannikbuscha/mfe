import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { eventRegistry } from './event-registry';

describe('eventRegistry', () => {
  afterEach(() => {
    delete window.__NF_REGISTRY__;
  });

  it('throws a helpful error when main.ts did not create the registry', () => {
    expect(() => eventRegistry()).toThrow(/createRegistry\(\)/);
  });

  it('returns the registry from window.__NF_REGISTRY__', () => {
    window.__NF_REGISTRY__ = createRegistry({ maxEvents: 5 })();
    const registry = eventRegistry();
    const received: number[] = [];

    registry.on('cart.items', ({ data }) => received.push(data.length), {
      replay: 0,
    });
    registry.update('cart.items', (items) => [
      ...(items ?? []),
      { productId: 'p1', name: 'P1', price: 1, quantity: 1 },
    ]);

    expect(received).toEqual([1]);
  });
});
