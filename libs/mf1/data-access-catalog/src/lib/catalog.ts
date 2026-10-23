import { Injectable, signal } from '@angular/core';
import type { Product } from './product';

// The ids are part of the e2e contract; do not rename them.
const PRODUCTS: readonly Product[] = [
  {
    id: 'espresso',
    name: 'Espresso',
    description: 'Kräftig, mit feiner Crema.',
    price: 2.4,
    emoji: '☕',
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: 'Espresso mit cremigem Milchschaum.',
    price: 3.2,
    emoji: '🥛',
  },
  {
    id: 'croissant',
    name: 'Croissant',
    description: 'Buttrig und frisch gebacken.',
    price: 2.1,
    emoji: '🥐',
  },
  {
    id: 'cheesecake',
    name: 'Käsekuchen',
    description: 'Nach Omas Rezept.',
    price: 3.9,
    emoji: '🍰',
  },
  {
    id: 'lemonade',
    name: 'Limonade',
    description: 'Hausgemacht mit Minze.',
    price: 2.8,
    emoji: '🍋',
  },
  {
    id: 'bagel',
    name: 'Bagel',
    description: 'Mit Frischkäse und Schnittlauch.',
    price: 2.6,
    emoji: '🥯',
  },
];

/** The (fixed) product range of the catalog micro frontend. */
@Injectable({ providedIn: 'root' })
export class Catalog {
  readonly products = signal(PRODUCTS).asReadonly();

  find(id: string | null | undefined): Product | undefined {
    return this.products().find((product) => product.id === id);
  }
}
