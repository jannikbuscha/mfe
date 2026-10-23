import { booleanAttribute, Component, input, output } from '@angular/core';
import { EuroPipe } from '@mfe/shared/ui';

/**
 * What the card needs to know about a product. Declared here (instead of
 * importing the data-access model) so the UI library stays presentational;
 * `Product` from `@mfe/mf1/data-access-catalog` fits structurally.
 */
export interface ProductCardModel {
  id: string;
  name: string;
  description: string;
  price: number;
  emoji: string;
}

/**
 * Presentational product card. Additional actions (e.g. a details link) are
 * projected next to the add button.
 */
@Component({
  selector: 'mf1-product-card',
  imports: [EuroPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  host: {
    '[attr.data-testid]': '"product-" + product().id',
    '[class.compact]': 'compact()',
  },
})
export class ProductCard {
  readonly product = input.required<ProductCardModel>();
  readonly quantityInCart = input(0);
  readonly compact = input(false, { transform: booleanAttribute });

  readonly add = output<ProductCardModel>();
}
