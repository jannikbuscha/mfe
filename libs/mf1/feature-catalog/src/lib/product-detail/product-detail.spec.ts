import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import type {
  MfeEventRegistry,
  ProductSelected,
} from '@mfe/shared/util-event-registry';
import { catalogRoutes } from '../catalog.routes';
import { CatalogPage } from '../catalog-page/catalog-page';
import { byTestId, recordEvents, testRegistry, text } from '../testing';
import { ProductDetail } from './product-detail';

describe('ProductDetail', () => {
  let registry: MfeEventRegistry;
  let selected: ProductSelected[];
  let harness: RouterTestingHarness;

  const page = () => harness.routeNativeElement;

  beforeEach(async () => {
    const test = testRegistry();
    registry = test.registry;
    TestBed.configureTestingModule({
      providers: [
        test.provider,
        // Mounted like in the shell, so absolute links would fail.
        provideRouter([{ path: 'mf1', children: catalogRoutes }]),
      ],
    });
    selected = recordEvents(registry, 'catalog.product-selected');
    harness = await RouterTestingHarness.create();
  });

  it('renders the product of the route parameter', async () => {
    await harness.navigateByUrl('/mf1/croissant', ProductDetail);

    expect(page()?.getAttribute('data-testid')).toBe('product-detail');
    expect(text(page()?.querySelector('h2'))).toBe('Croissant');
    expect(text(page())).toContain('Buttrig und frisch gebacken.');
    expect(text(page())).toContain('2,10 €');
    expect(byTestId(page(), 'back-to-catalog')?.getAttribute('href')).toBe(
      '/mf1',
    );
  });

  it('publishes catalog.product-selected once per opened product', async () => {
    await harness.navigateByUrl('/mf1/croissant', ProductDetail);
    await harness.fixture.whenStable();
    expect(selected).toEqual([{ productId: 'croissant', name: 'Croissant' }]);

    // Same component instance, new parameter.
    await harness.navigateByUrl('/mf1/bagel', ProductDetail);
    await harness.fixture.whenStable();
    expect(selected).toEqual([
      { productId: 'croissant', name: 'Croissant' },
      { productId: 'bagel', name: 'Bagel' },
    ]);
  });

  it('adds the product to the cart', async () => {
    await harness.navigateByUrl('/mf1/espresso', ProductDetail);
    expect(byTestId(page(), 'in-cart-espresso')).toBeNull();

    byTestId(page(), 'add-espresso')?.click();
    byTestId(page(), 'add-espresso')?.click();
    await harness.fixture.whenStable();

    expect(text(byTestId(page(), 'in-cart-espresso'))).toBe('Im Warenkorb: 2');
  });

  it('shows a message and the back link for unknown products', async () => {
    await harness.navigateByUrl('/mf1/pizza', ProductDetail);
    await harness.fixture.whenStable();

    expect(text(page())).toContain('Produkt nicht gefunden.');
    expect(page()?.querySelector('h2')).toBeNull();
    expect(byTestId(page(), 'back-to-catalog')).not.toBeNull();
    expect(selected).toEqual([]);
  });

  it('navigates back to the catalog', async () => {
    await harness.navigateByUrl('/mf1/espresso', ProductDetail);

    byTestId(page(), 'back-to-catalog')?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/mf1');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(
      CatalogPage,
    );
  });
});
