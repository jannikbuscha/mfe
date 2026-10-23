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
      providers: [
        testRegistry().provider,
        // Mounted like in the shell, so absolute links would fail.
        provideRouter([{ path: 'mf1', children: catalogRoutes }]),
      ],
    });
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/mf1', CatalogPage);
  });

  it('renders all products with relative detail links', () => {
    expect(page()?.getAttribute('data-testid')).toBe('catalog-page');
    expect(page()?.querySelectorAll('mf1-product-card')).toHaveLength(6);
    const details = byTestId(page(), 'details-espresso');
    expect(details?.getAttribute('href')).toBe('/mf1/espresso');
    expect(details?.getAttribute('aria-label')).toBe('Details zu Espresso');
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

    expect(TestBed.inject(Router).url).toBe('/mf1/croissant');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(
      ProductDetail,
    );
  });
});
