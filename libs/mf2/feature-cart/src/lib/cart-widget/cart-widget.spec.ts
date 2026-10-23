import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import type { MfeEventRegistry } from '@mfe/shared/util-event-registry';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { CartWidget } from './cart-widget';

describe('CartWidget', () => {
  let registry: MfeEventRegistry;
  let fixture: ComponentFixture<CartWidget>;

  const query = (testId: string) =>
    fixture.nativeElement.querySelector(
      `[data-testid="${testId}"]`,
    ) as HTMLElement | null;

  beforeEach(() => {
    registry = createRegistry({ maxEvents: 10 })();
    TestBed.configureTestingModule({
      providers: [{ provide: EVENT_REGISTRY, useValue: registry }],
    });
  });

  it('marks its root element and renders the compact cart', async () => {
    registry.update('cart.items', () => [
      { productId: 'espresso', name: 'Espresso', price: 2.4, quantity: 1 },
    ]);

    fixture = TestBed.createComponent(CartWidget);
    await fixture.whenStable();

    expect(fixture.nativeElement.getAttribute('data-testid')).toBe(
      'mf2-widget',
    );
    expect(query('cart-line-espresso')).not.toBeNull();
    expect(query('checkout')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[href]')).toBeNull();
  });

  it('shows the product selected last in MF1, including earlier selections', async () => {
    registry.emit('catalog.product-selected', {
      productId: 'bagel',
      name: 'Bagel',
    });

    fixture = TestBed.createComponent(CartWidget);
    await fixture.whenStable();
    expect(query('last-selected')?.textContent).toContain('Bagel');

    registry.emit('catalog.product-selected', {
      productId: 'cheesecake',
      name: 'Käsekuchen',
    });
    await fixture.whenStable();

    expect(query('last-selected')?.textContent).toContain(
      'Zuletzt angesehen: Käsekuchen',
    );
  });

  it('renders no last-selected hint before anything was selected', async () => {
    fixture = TestBed.createComponent(CartWidget);
    await fixture.whenStable();

    expect(query('last-selected')).toBeNull();
    expect(query('cart-empty')).not.toBeNull();
  });
});
