import { Component, inject } from '@angular/core';
import { Catalog } from '@mfe/mf1/data-access-catalog';
import { ProductCard, ProductCardModel } from '@mfe/mf1/ui-catalog';
import { CartStore } from '@mfe/shared/data-access-cart';
import { EventBus } from '@mfe/shared/data-access-event-bus';
import { toCartProduct, toProductSelected } from '../mappers';

/**
 * Compact catalog for the shell dashboard (exposed as `./Widget`). It lives
 * outside the remote's routes, so "Auswählen" publishes an event instead of
 * navigating.
 */
@Component({
  selector: 'mf1-catalog-widget',
  imports: [ProductCard],
  templateUrl: './catalog-widget.html',
  styleUrl: './catalog-widget.scss',
  host: { 'data-testid': 'mf1-widget' },
})
export class CatalogWidget {
  private readonly bus = inject(EventBus);
  protected readonly products = inject(Catalog).products;
  protected readonly cart = inject(CartStore);
  protected readonly lastSelected = this.bus.state('catalog.product-selected');

  protected add(product: ProductCardModel): void {
    this.cart.add(toCartProduct(product));
  }

  protected select(product: ProductCardModel): void {
    this.bus.emit('catalog.product-selected', toProductSelected(product));
  }
}
