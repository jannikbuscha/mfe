import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import type { MfeEventRegistry } from '@mfe/shared/util-event-registry';
import { EVENT_REGISTRY, EventBus } from './event-bus';

const item = (productId: string) => ({
  productId,
  name: productId,
  price: 10,
  quantity: 1,
});

/** Lets the registry deliver its replay, which it schedules as a microtask. */
const flushReplay = () => Promise.resolve();

describe('EventBus', () => {
  let registry: MfeEventRegistry;
  let bus: EventBus;
  let injector: Injector;

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 10 })();
    TestBed.configureTestingModule({
      providers: [{ provide: EVENT_REGISTRY, useValue: registry }],
    });
    bus = TestBed.inject(EventBus);
    injector = TestBed.inject(Injector);
  });

  it('state() replays the current value to late subscribers', async () => {
    bus.update('cart.items', () => [item('a')]);

    const cart = runInInjectionContext(injector, () => bus.state('cart.items'));
    await flushReplay();

    expect(cart()).toEqual([item('a')]);
  });

  it('state() follows later updates', async () => {
    const cart = bus.state('cart.items', { injector });
    bus.update('cart.items', (items) => [...(items ?? []), item('a')]);
    bus.update('cart.items', (items) => [...(items ?? []), item('b')]);
    await flushReplay();

    expect(cart()?.map((i) => i.productId)).toEqual(['a', 'b']);
  });

  it('history() backfills and caps the list at the limit', async () => {
    for (const id of ['1', '2', '3']) {
      bus.emit('catalog.product-selected', { productId: id, name: id });
    }

    const selected = bus.history('catalog.product-selected', {
      limit: 2,
      injector,
    });
    await flushReplay();
    bus.emit('catalog.product-selected', { productId: '4', name: '4' });

    expect(selected().map((e) => e.data.productId)).toEqual(['3', '4']);
  });

  it('history() does not duplicate events emitted before the replay ran', async () => {
    bus.emit('catalog.product-selected', { productId: '1', name: '1' });

    const selected = bus.history('catalog.product-selected', {
      limit: 5,
      injector,
    });
    // Delivered live right away and again by the (microtask) replay.
    bus.emit('catalog.product-selected', { productId: '2', name: '2' });
    await flushReplay();

    expect(selected().map((e) => e.data.productId)).toEqual(['1', '2']);
  });

  it('state() throws outside an injection context without an injector', () => {
    expect(() => bus.state('cart.items')).toThrow();
  });

  it('unsubscribes when the owning injector is destroyed', async () => {
    const child = Injector.create({ providers: [], parent: injector });
    const cart = runInInjectionContext(child, () => bus.state('cart.items'));
    await flushReplay();

    (child as unknown as { destroy(): void }).destroy();
    bus.update('cart.items', () => [item('late')]);

    expect(cart()).toBeUndefined();
  });

  it('whenReady() resolves registered resources', async () => {
    const result = { loadRemoteModule: vi.fn() };
    void registry.register('orch.init-ready', result as never);

    await expect(bus.whenReady('orch.init-ready')).resolves.toBe(result);
  });

  it('on$() emits live events and stops on unsubscribe', () => {
    const seen: string[] = [];
    const sub = bus
      .on$('catalog.product-selected', { replay: 0 })
      .subscribe(({ data }) => seen.push(data.productId));

    bus.emit('catalog.product-selected', { productId: 'x', name: 'x' });
    sub.unsubscribe();
    bus.emit('catalog.product-selected', { productId: 'y', name: 'y' });

    expect(seen).toEqual(['x']);
  });
});
