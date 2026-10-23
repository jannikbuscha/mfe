import { inject } from '@angular/core';
import type { ResolveFn, Routes } from '@angular/router';
import { Catalog } from '@mfe/mf1/data-access-catalog';
import { CatalogPage } from './catalog-page/catalog-page';
import { ProductDetail } from './product-detail/product-detail';

// Plain page titles: the shell adds its own suffix via a TitleStrategy.
const productTitle: ResolveFn<string> = (route) =>
  inject(Catalog).find(route.paramMap.get('productId'))?.name ??
  'Produkt nicht gefunden';

/**
 * Mounted at `/mf1` by the shell and at `/` by the standalone app, so all
 * links inside these pages are relative.
 */
export const catalogRoutes: Routes = [
  { path: '', title: 'Katalog', component: CatalogPage },
  { path: ':productId', title: productTitle, component: ProductDetail },
  { path: '**', redirectTo: '' },
];
