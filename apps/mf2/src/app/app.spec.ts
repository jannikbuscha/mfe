import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { EVENT_REGISTRY } from '@mfe/shared/data-access-event-bus';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EVENT_REGISTRY,
          useValue: createRegistry({ maxEvents: 10 })(),
        },
        provideRouter(appRoutes),
      ],
    });
  });

  it('renders the standalone header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('h1')?.textContent).toBe('MF2 · Warenkorb');
    expect(root.querySelector('.header__hint')?.textContent).toBe('standalone');
  });

  it('mounts the exposed routes at the root', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const root = fixture.nativeElement as HTMLElement;

    await router.navigateByUrl('/');
    await fixture.whenStable();
    expect(root.querySelector('[data-testid="cart-page"]')).not.toBeNull();
    expect(
      root.querySelector('[data-testid="orders-link"]')?.getAttribute('href'),
    ).toBe('/orders');

    await router.navigateByUrl('/orders');
    await fixture.whenStable();
    expect(root.querySelector('[data-testid="orders-page"]')).not.toBeNull();
  });
});
