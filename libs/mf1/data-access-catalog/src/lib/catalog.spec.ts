import { TestBed } from '@angular/core/testing';
import { Catalog } from './catalog';

describe('Catalog', () => {
  let catalog: Catalog;

  beforeEach(() => {
    catalog = TestBed.inject(Catalog);
  });

  it('provides the fixed product range', () => {
    expect(catalog.products().map((p) => p.id)).toEqual([
      'espresso',
      'cappuccino',
      'croissant',
      'cheesecake',
      'lemonade',
      'bagel',
    ]);
    expect(catalog.products().every((p) => p.price > 0 && p.emoji)).toBe(true);
  });

  it('finds a product by id', () => {
    expect(catalog.find('cheesecake')).toEqual({
      id: 'cheesecake',
      name: 'Käsekuchen',
      description: 'Nach Omas Rezept.',
      price: 3.9,
      emoji: '🍰',
    });
  });

  it('returns undefined for unknown or missing ids', () => {
    expect(catalog.find('pizza')).toBeUndefined();
    expect(catalog.find(null)).toBeUndefined();
    expect(catalog.find(undefined)).toBeUndefined();
  });
});
