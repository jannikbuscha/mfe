import { Route } from '@angular/router';
import { CartPage } from './cart-page/cart-page';
import { OrdersPage } from './orders-page/orders-page';

/**
 * Exposed as `./Routes`. Mounted at `/mf2` by the shell and at `/` when MF2
 * runs standalone, which is why all links inside are relative. The titles are
 * plain page names; the shell adds its own suffix.
 */
export const cartRoutes: Route[] = [
  { path: '', pathMatch: 'full', title: 'Warenkorb', component: CartPage },
  { path: 'orders', title: 'Bestellungen', component: OrdersPage },
  { path: '**', redirectTo: '' },
];
