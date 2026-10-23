import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { catalogRoutes } from '../catalog.routes';
import { ProductDetail } from '../product-detail/product-detail';
import { byTestId, testRegistry, text } from '../testing';
import { CatalogPage } from './catalog-page';

describe('CatalogPage', () => {
  let harness: RouterTestingHarness;

  const page = () => harness.routeNativeElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [testRegistry().provider, provideRouter(catalogRoutes)],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', CatalogPage);
  });

  it('renders all products with relative detail links', () => {
    expect(page()?.getAttribute('data-testid')).toBe('catalog-page');
    expect(page()?.querySelectorAll('mf1-product-card')).toHaveLength(6);
    expect(byTestId(page(), 'details-espresso')?.getAttribute('href')).toBe(
      '/espresso',
    );
    expect(text(byTestId(page(), 'product-cheesecake'))).toContain(
      'Käsekuchen',
    );
  });

  it('adds products to the cart', async () => {
    byTestId(page(), 'add-lemonade')?.click();
    await harness.fixture.whenStable();

    expect(text(byTestId(page(), 'in-cart-lemonade'))).toBe('Im Warenkorb: 1');
  });

  it('opens the detail page', async () => {
    byTestId(page(), 'details-croissant')?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/croissant');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(
      ProductDetail,
    );
  });
});
