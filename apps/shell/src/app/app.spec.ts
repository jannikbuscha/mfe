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

  async function render() {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const byTestId = (testId: string) =>
      root.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
    return { fixture, root, byTestId };
  }

  it('renders the brand, the navigation and the router outlet', async () => {
    const { root, byTestId } = await render();

    expect(root.querySelector('h1')?.textContent).toContain('MFE Shell');
    expect(byTestId('nav-dashboard')?.getAttribute('href')).toBe('/');
    expect(byTestId('nav-mf1')?.getAttribute('href')).toBe('/mf1');
    expect(byTestId('nav-mf2')?.getAttribute('href')).toBe('/mf2');
    expect(byTestId('nav-orders')?.getAttribute('href')).toBe('/mf2/orders');
    expect(root.querySelector('main router-outlet')).not.toBeNull();
  });

  it('shows the item count of the shared cart in the badge', async () => {
    const { fixture, byTestId } = await render();
    expect(byTestId('cart-badge')?.textContent?.trim()).toBe('0');

    registry.update('cart.items', () => [
      { productId: 'espresso', name: 'Espresso', price: 2.4, quantity: 2 },
      { productId: 'bagel', name: 'Bagel', price: 2.6, quantity: 1 },
    ]);
    await fixture.whenStable();

    expect(byTestId('cart-badge')?.textContent?.trim()).toBe('3');
  });
});
