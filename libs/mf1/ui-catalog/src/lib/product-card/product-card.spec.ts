import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCard, ProductCardModel } from './product-card';

const espresso: ProductCardModel = {
  id: 'espresso',
  name: 'Espresso',
  description: 'Kräftig, mit feiner Crema.',
  price: 2.4,
  emoji: '☕',
};

@Component({
  imports: [ProductCard],
  template: `
    <mf1-product-card
      [product]="product"
      [quantityInCart]="quantity()"
      [compact]="compact()"
      (add)="added.push($event)"
    >
      <button class="extra" type="button">Details</button>
    </mf1-product-card>
  `,
})
class Host {
  readonly product = espresso;
  readonly quantity = signal(0);
  readonly compact = signal(false);
  readonly added: ProductCardModel[] = [];
}

/** `Intl` separates amount and currency with a non-breaking space. */
const normalize = (text: string | null | undefined) =>
  (text ?? '').replace(/\s+/g, ' ').trim();

describe('ProductCard', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let element: HTMLElement;

  const query = (testId: string) =>
    element.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders the product with its test id', () => {
    const card = query('product-espresso');

    expect(card?.querySelector('h3')?.textContent).toBe('Espresso');
    expect(card?.textContent).toContain('Kräftig, mit feiner Crema.');
    expect(normalize(card?.querySelector('.card__price')?.textContent)).toBe(
      '2,40 €',
    );
    expect(normalize(query('add-espresso')?.textContent)).toBe(
      'In den Warenkorb',
    );
  });

  it('shows the quantity in the cart only when it is greater than zero', async () => {
    expect(query('in-cart-espresso')).toBeNull();

    host.quantity.set(2);
    await fixture.whenStable();

    expect(normalize(query('in-cart-espresso')?.textContent)).toBe(
      'Im Warenkorb: 2',
    );
  });

  it('emits the product when the add button is clicked', () => {
    query('add-espresso')?.click();

    expect(host.added).toEqual([espresso]);
  });

  it('projects extra actions', () => {
    expect(
      query('product-espresso')?.querySelector('.card__actions .extra')
        ?.textContent,
    ).toBe('Details');
  });

  it('hides the description in compact mode', async () => {
    host.compact.set(true);
    await fixture.whenStable();

    const card = query('product-espresso');
    expect(card?.classList).toContain('compact');
    expect(card?.textContent).not.toContain('Kräftig');
  });
});
