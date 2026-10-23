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

  describe('when events are emitted before the replay microtask ran', () => {
    // All events in one millisecond, the usual case for synchronous code.
    beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(1_000));
    afterEach(() => vi.restoreAllMocks());

    const select = (productId: string) =>
      bus.emit('catalog.product-selected', { productId, name: productId });
    const ids = (events: readonly { data: { productId: string } }[]) =>
      events.map((e) => e.data.productId);

    it('history() keeps order and does not duplicate them', async () => {
      select('1');
      const selected = bus.history('catalog.product-selected', {
        limit: 5,
        injector,
      });
      // Delivered live right away and again at the end of the backfill.
      select('2');
      await flushReplay();
      select('3');

      expect(ids(selected())).toEqual(['1', '2', '3']);
    });

    it('history() keeps identical events that really happened twice', async () => {
      select('x');
      select('x');
      const selected = bus.history('catalog.product-selected', {
        limit: 5,
        injector,
      });
      select('x');
      await flushReplay();

      expect(ids(selected())).toEqual(['x', 'x', 'x']);
    });

    it('history() merges correctly when the registry trims its history', async () => {
      // maxEvents 10: the 11th event makes the registry start a new array,
      // so the backfill only contains the first of the two live events.
      for (let i = 1; i <= 10; i++) select(`old${i}`);
      const selected = bus.history('catalog.product-selected', {
        limit: 4,
        injector,
      });
      select('new1');
      select('new2');
      await flushReplay();

      expect(ids(selected())).toEqual(['old9', 'old10', 'new1', 'new2']);
    });

    it('history() takes live events when the stream had no history yet', async () => {
      const selected = bus.history('catalog.product-selected', {
        limit: 5,
        injector,
      });
      select('1');
      select('2');
      await flushReplay();

      expect(ids(selected())).toEqual(['1', '2']);
    });

    it('state() ends on the newest value even across a history trim', async () => {
      for (let i = 1; i <= 10; i++) {
        bus.update('cart.items', () => [item(`old${i}`)]);
      }
      const cart = bus.state('cart.items', { injector });
      bus.update('cart.items', () => [item('a')]);
      bus.update('cart.items', () => [item('b')]);
      await flushReplay();

      expect(cart()).toEqual([item('b')]);
    });
  });

  it('state() throws outside an injection context without an injector', () => {
    expect(() => bus.state('cart.items')).toThrow(/NG0203/);
  });

  it('unsubscribes when the owning injector is destroyed', async () => {
    const child = Injector.create({ providers: [], parent: injector });
    const cart = runInInjectionContext(child, () => bus.state('cart.items'));
    await flushReplay();

    (child as unknown as { destroy(): void }).destroy();
    bus.update('cart.items', () => [item('late')]);

    expect(cart()).toBeUndefined();
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
