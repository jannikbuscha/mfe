import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type { MfeEventRegistry } from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { App } from './app';

describe('App', () => {
  let registry: MfeEventRegistry;

  beforeEach(async () => {
    registry = createRegistry({ maxEvents: 10 })();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: EVENT_REGISTRY, useValue: registry },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('renders the standalone header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'MF1 · Katalog',
    );
    expect(compiled.querySelector('.badge')?.textContent).toContain(
      'standalone',
    );
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  it('shows the item count of the shared cart', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const count = () =>
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="cart-count"] strong',
      )?.textContent;
    expect(count()).toBe('0');

    registry.update('cart.items', () => [
      { productId: 'espresso', name: 'Espresso', price: 2.4, quantity: 2 },
      { productId: 'bagel', name: 'Bagel', price: 2.6, quantity: 1 },
    ]);
    await fixture.whenStable();

    expect(count()).toBe('3');
  });
});
