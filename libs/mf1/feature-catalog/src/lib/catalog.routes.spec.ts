import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CatalogPage } from './catalog-page/catalog-page';
import { catalogRoutes } from './catalog.routes';
import { ProductDetail } from './product-detail/product-detail';
import { byTestId, testRegistry, text } from './testing';

describe('catalogRoutes', () => {
  let harness: RouterTestingHarness;

  const page = () => harness.routeNativeElement;
  const url = () => TestBed.inject(Router).url;
  const title = () => TestBed.inject(Title).getTitle();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        testRegistry().provider,
        // Mounted like in the shell, to prove that all links are relative.
        provideRouter([{ path: 'mf1', children: catalogRoutes }]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('navigates between catalog and detail page with relative links', async () => {
    await harness.navigateByUrl('/mf1', CatalogPage);
    expect(title()).toBe('Katalog');
    expect(byTestId(page(), 'details-bagel')?.getAttribute('href')).toBe(
      '/mf1/bagel',
    );

    byTestId(page(), 'details-bagel')?.click();
    await harness.fixture.whenStable();
    expect(url()).toBe('/mf1/bagel');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(
      ProductDetail,
    );
    expect(title()).toBe('Bagel');
    expect(byTestId(page(), 'back-to-catalog')?.getAttribute('href')).toBe(
      '/mf1',
    );

    byTestId(page(), 'back-to-catalog')?.click();
    await harness.fixture.whenStable();
    expect(url()).toBe('/mf1');
    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(
      CatalogPage,
    );
    expect(title()).toBe('Katalog');
  });

  it('titles the detail page of an unknown product', async () => {
    await harness.navigateByUrl('/mf1/pizza', ProductDetail);

    expect(title()).toBe('Produkt nicht gefunden');
    expect(text(page())).toContain('Produkt nicht gefunden.');
  });

  it('redirects unknown deep paths to the catalog', async () => {
    await harness.navigateByUrl('/mf1/a/b', CatalogPage);

    expect(url()).toBe('/mf1');
    expect(title()).toBe('Katalog');
  });
});
