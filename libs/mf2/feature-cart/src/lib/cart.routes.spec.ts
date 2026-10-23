import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { cartRoutes } from './cart.routes';

describe('cartRoutes', () => {
  let harness: RouterTestingHarness;

  const query = (testId: string) =>
    (harness.fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      `[data-testid="${testId}"]`,
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EVENT_REGISTRY,
          useValue: createRegistry({ maxEvents: 10 })(),
        },
        // Mounted like in the shell, to prove that all links are relative.
        provideRouter([{ path: 'mf2', children: cartRoutes }]),
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it('navigates between cart and orders with relative links', async () => {
    await harness.navigateByUrl('/mf2');
    expect(query('cart-page')).not.toBeNull();
    expect(query('orders-link')?.getAttribute('href')).toBe('/mf2/orders');

    query('orders-link')?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/mf2/orders');
    expect(query('orders-page')).not.toBeNull();
    expect(query('cart-link')?.getAttribute('href')).toBe('/mf2');

    query('cart-link')?.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/mf2');
  });

  it('gives each page its own title', async () => {
    const title = TestBed.inject(Title);

    await harness.navigateByUrl('/mf2');
    expect(title.getTitle()).toBe('Warenkorb');

    await harness.navigateByUrl('/mf2/orders');
    expect(title.getTitle()).toBe('Bestellungen');
  });

  it('redirects unknown paths to the cart', async () => {
    await harness.navigateByUrl('/mf2/unknown');

    expect(TestBed.inject(Router).url).toBe('/mf2');
    expect(query('cart-page')).not.toBeNull();
  });
});
