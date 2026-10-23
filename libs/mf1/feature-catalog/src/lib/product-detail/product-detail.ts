import { Component, computed, effect, inject, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Catalog, Product } from '@mfe/mf1/data-access-catalog';
import { CartStore } from '@mfe/shared/data-access-cart';
import { EventBus } from '@mfe/shared/data-access-event-bus';
import { EuroPipe } from '@mfe/shared/ui';
import { map } from 'rxjs';
import { toCartProduct, toProductSelected } from '../mappers';

@Component({
  selector: 'mf1-product-detail',
  imports: [RouterLink, EuroPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
  host: { 'data-testid': 'product-detail' },
})
export class ProductDetail {
  private readonly catalog = inject(Catalog);
  private readonly bus = inject(EventBus);
  protected readonly cart = inject(CartStore);

  // The router reuses this component when only the id changes, so the id
  // has to be followed instead of read once from the snapshot.
  private readonly productId = toSignal(
    inject(ActivatedRoute).paramMap.pipe(
      map((params) => params.get('productId')),
    ),
    { requireSync: true },
  );

  protected readonly product = computed(() =>
    this.catalog.find(this.productId()),
  );

  constructor() {
    // `find` returns the same object for the same id, so this runs once per
    // opened product, not on every change detection.
    effect(() => {
      const product = this.product();
      if (product) {
        untracked(() =>
          this.bus.emit('catalog.product-selected', toProductSelected(product)),
        );
      }
    });
  }

  protected add(product: Product): void {
    this.cart.add(toCartProduct(product));
  }
}
