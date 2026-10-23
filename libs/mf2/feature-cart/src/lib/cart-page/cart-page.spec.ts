import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { CartPage } from './cart-page';

describe('CartPage', () => {
  it('renders the cart inside an MF2 panel with a link to the orders', async () => {
    const registry = createRegistry({ maxEvents: 10 })();
    registry.update('cart.items', () => [
      { productId: 'bagel', name: 'Bagel', price: 2.6, quantity: 2 },
    ]);
    TestBed.configureTestingModule({
      providers: [
        { provide: EVENT_REGISTRY, useValue: registry },
        provideRouter([]),
      ],
    });

    const fixture = TestBed.createComponent(CartPage);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.getAttribute('data-testid')).toBe('cart-page');
    expect(root.querySelector('ui-panel')?.getAttribute('data-accent')).toBe(
      'mf2',
    );
    expect(
      root.querySelector('[data-testid="qty-bagel"]')?.textContent?.trim(),
    ).toBe('2');
    expect(
      root.querySelector('[data-testid="orders-link"]')?.getAttribute('href'),
    ).toBe('/orders');
  });
});
