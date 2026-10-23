import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import { EventLog } from '@mfe/shared/ui';
import type { MfeEventRegistry } from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import type { MockInstance } from 'vitest';
import { EventMonitor } from './event-monitor';

const espresso = {
  productId: 'espresso',
  name: 'Espresso',
  price: 2.4,
  quantity: 1,
};

describe('EventMonitor', () => {
  let registry: MfeEventRegistry;
  let now: MockInstance<typeof Date.now>;

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 30 })();
    TestBed.configureTestingModule({
      providers: [{ provide: EVENT_REGISTRY, useValue: registry }],
    });
    now = vi.spyOn(Date, 'now');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function render() {
    const fixture = TestBed.createComponent(EventMonitor);
    await fixture.whenStable();
    const log = fixture.debugElement.query(By.directive(EventLog))
      .componentInstance as EventLog;
    return { fixture, entries: () => log.entries() };
  }

  it('shows the empty text before anything happened', async () => {
    const { fixture } = await render();

    expect(fixture.nativeElement.textContent).toContain('Noch keine Events.');
  });

  it('merges all streams, newest first, including events from before it was created', async () => {
    now.mockReturnValue(1_000);
    registry.update('cart.items', () => [espresso]);
    now.mockReturnValue(2_000);
    registry.emit('catalog.product-selected', {
      productId: 'croissant',
      name: 'Croissant',
    });
    now.mockReturnValue(3_000);
    registry.emit('cart.checked-out', {
      orderId: 'ORD-1',
      items: [espresso],
      total: 2.4,
      placedAt: 3_000,
    });

    const { fixture, entries } = await render();

    expect(entries().map((e) => [e.type, e.timestamp])).toEqual([
      ['cart.checked-out', 3_000],
      ['catalog.product-selected', 2_000],
      ['cart.items', 1_000],
    ]);
    expect(entries()[2].data).toEqual([espresso]);

    now.mockReturnValue(4_000);
    registry.update('cart.items', () => []);
    await fixture.whenStable();

    expect(entries()[0]).toEqual({
      type: 'cart.items',
      timestamp: 4_000,
      data: [],
    });
  });

  it('keeps events with the same timestamp in the order they were published', async () => {
    now.mockReturnValue(1_000);
    registry.update('cart.items', () => [espresso]);
    registry.update('cart.items', () => [{ ...espresso, quantity: 2 }]);

    const { entries } = await render();

    expect(entries().map((e) => e.data)).toEqual([
      [{ ...espresso, quantity: 2 }],
      [espresso],
    ]);
  });

  it('shows the newest 20 events across all streams', async () => {
    for (let i = 0; i < 15; i++) {
      now.mockReturnValue(i * 10);
      registry.emit('catalog.product-selected', {
        productId: `p${i}`,
        name: `P${i}`,
      });
      now.mockReturnValue(i * 10 + 5);
      registry.update('cart.items', () => []);
    }

    const { fixture, entries } = await render();

    expect(entries()).toHaveLength(20);
    expect(entries()[0].timestamp).toBe(145);
    expect(entries()[19].timestamp).toBe(50);
    expect(fixture.nativeElement.textContent).toContain('20 / 20');
  });
});
