import { Component, inject } from '@angular/core';
import { EventBus } from '@mfe/shared/data-access-event-bus';
import { CartView } from '../cart-view/cart-view';

/**
 * Exposed as `./Widget` for the shell dashboard. It is rendered outside of
 * MF2's routes, so it must not contain router links.
 */
@Component({
  selector: 'mf2-cart-widget',
  imports: [CartView],
  templateUrl: './cart-widget.html',
  styleUrl: './cart-widget.scss',
  host: { 'data-testid': 'mf2-widget' },
})
export class CartWidget {
  protected readonly lastSelected = inject(EventBus).state(
    'catalog.product-selected',
  );
}
