import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CartStore } from '@mfe/shared/data-access-cart';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type { MfeEventRegistry } from '@mfe/shared/util-event-registry';
import { loadRemoteWidget } from '@mfe/shell/util-federation';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { Dashboard } from './dashboard';

vi.mock('@mfe/shell/util-federation', () => ({ loadRemoteWidget: vi.fn() }));

@Component({
  selector: 'shell-fake-catalog',
  template: `<button data-testid="add-espresso" (click)="add()">+</button>`,
})
class FakeCatalog {
  private readonly cart = inject(CartStore);

  add() {
    this.cart.add({ productId: 'espresso', name: 'Espresso', price: 2.4 });
  }
}

@Component({
  selector: 'shell-fake-cart',
  template: `<p data-testid="count">{{ cart.itemCount() }}</p>`,
})
class FakeCart {
  protected readonly cart = inject(CartStore);
}

describe('Dashboard', () => {
  let registry: MfeEventRegistry;

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 10 })();
    TestBed.configureTestingModule({
      providers: [{ provide: EVENT_REGISTRY, useValue: registry }],
    });
    vi.mocked(loadRemoteWidget).mockImplementation((remote) =>
      Promise.resolve(remote === 'mf1' ? FakeCatalog : FakeCart),
    );
  });

  async function render() {
    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const query = (selector: string) =>
      root.querySelector<HTMLElement>(selector);
    return { fixture, query };
  }

  it('renders the widgets of both remotes in their own slot', async () => {
    const { query } = await render();

    expect(query('[data-testid="dashboard"]')).not.toBeNull();
    expect(
      query('[data-testid="slot-mf1"] [data-testid="add-espresso"]'),
    ).not.toBeNull();
    expect(
      query('[data-testid="slot-mf2"] [data-testid="count"]')?.textContent,
    ).toBe('0');
    expect(query('[data-testid="slot-mf1"]')?.textContent).toContain(
      'mf1 · ./Widget',
    );
    expect(query('[data-testid="slot-mf2"]')?.textContent).toContain(
      'mf2 · ./Widget',
    );
  });

  it('shows what the widgets publish in the event monitor', async () => {
    const { fixture, query } = await render();

    query('[data-testid="add-espresso"]')?.click();
    await fixture.whenStable();

    expect(query('[data-testid="count"]')?.textContent).toBe('1');
    expect(query('[data-testid="event-monitor"]')?.textContent).toContain(
      'cart.items',
    );
  });
});
