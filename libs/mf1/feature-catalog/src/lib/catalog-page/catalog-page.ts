import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Catalog } from '@mfe/mf1/data-access-catalog';
import { ProductCard, ProductCardModel } from '@mfe/mf1/ui-catalog';
import { CartStore } from '@mfe/shared/data-access-cart';
import { toCartProduct } from '../mappers';

@Component({
  selector: 'mf1-catalog-page',
  imports: [ProductCard, RouterLink],
  templateUrl: './catalog-page.html',
  styleUrl: './catalog-page.scss',
  host: { 'data-testid': 'catalog-page' },
})
export class CatalogPage {
  protected readonly products = inject(Catalog).products;
  protected readonly cart = inject(CartStore);

  protected add(product: ProductCardModel): void {
    this.cart.add(toCartProduct(product));
  }
}
