import { ComponentFixture, TestBed } from '@angular/core/testing';
import type {
  CartItem,
  MfeEventRegistry,
} from '@mfe/shared/util-event-registry';
import { byTestId, recordEvents, testRegistry, text } from '../testing';
import { CatalogWidget } from './catalog-widget';

describe('CatalogWidget', () => {
  let registry: MfeEventRegistry;
  let fixture: ComponentFixture<CatalogWidget>;
  let element: HTMLElement;

  beforeEach(async () => {
    const test = testRegistry();
    registry = test.registry;
    TestBed.configureTestingModule({ providers: [test.provider] });
    fixture = TestBed.createComponent(CatalogWidget);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders a compact card with add and select buttons per product', () => {
    expect(element.getAttribute('data-testid')).toBe('mf1-widget');
    const cards = element.querySelectorAll('mf1-product-card');
    expect(cards).toHaveLength(6);
    expect([...cards].every((card) => card.classList.contains('compact'))).toBe(
      true,
    );
    const select = byTestId(element, 'select-espresso');
    expect(text(select)).toBe('Auswählen');
    expect(select?.getAttribute('aria-label')).toBe('Auswählen: Espresso');
    expect(select?.hasAttribute('aria-current')).toBe(false);
    expect(text(byTestId(element, 'add-espresso'))).toBe('In den Warenkorb');
    expect(element.querySelector('a[href]')).toBeNull();
  });

  it('adds products to the cart.items state channel', async () => {
    byTestId(element, 'add-espresso')?.click();
    byTestId(element, 'add-espresso')?.click();
    byTestId(element, 'add-bagel')?.click();

    let cart: readonly CartItem[] | undefined;
    registry.on('cart.items', ({ data }) => (cart = data));
    await fixture.whenStable();

    expect(cart).toEqual([
      { productId: 'espresso', name: 'Espresso', price: 2.4, quantity: 2 },
      { productId: 'bagel', name: 'Bagel', price: 2.6, quantity: 1 },
    ]);
    expect(text(byTestId(element, 'in-cart-espresso'))).toBe('Im Warenkorb: 2');
    expect(byTestId(element, 'in-cart-croissant')).toBeNull();
  });

  it('shows quantities from carts changed by other micro frontends', async () => {
    registry.update('cart.items', () => [
      { productId: 'lemonade', name: 'Limonade', price: 2.8, quantity: 3 },
    ]);
    await fixture.whenStable();

    expect(text(byTestId(element, 'in-cart-lemonade'))).toBe('Im Warenkorb: 3');
  });

  it('publishes catalog.product-selected when "Auswählen" is clicked', async () => {
    const selected = recordEvents(registry, 'catalog.product-selected');

    byTestId(element, 'select-croissant')?.click();
    await fixture.whenStable();

    expect(selected).toEqual([{ productId: 'croissant', name: 'Croissant' }]);
    const croissant = byTestId(element, 'select-croissant');
    expect(croissant?.classList).toContain('details--active');
    expect(croissant?.getAttribute('aria-current')).toBe('true');
    expect(
      byTestId(element, 'select-espresso')?.hasAttribute('aria-current'),
    ).toBe(false);
  });
});
