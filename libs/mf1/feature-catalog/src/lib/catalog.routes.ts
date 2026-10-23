import type { Routes } from '@angular/router';
import { CatalogPage } from './catalog-page/catalog-page';
import { ProductDetail } from './product-detail/product-detail';

/**
 * Mounted at `/mf1` by the shell and at `/` by the standalone app, so all
 * links inside these pages are relative.
 */
export const catalogRoutes: Routes = [
  { path: '', component: CatalogPage },
  { path: ':productId', component: ProductDetail },
];
