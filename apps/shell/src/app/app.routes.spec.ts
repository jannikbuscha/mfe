import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import { appRoutes } from './app.routes';
import { RemoteUnavailable } from './remote-unavailable/remote-unavailable';

@Component({ template: '<p>Katalog</p>' })
class FakeCatalog {}

@Component({ template: '<p>Widget</p>' })
class FakeWidget {}

describe('appRoutes', () => {
  const loadRemoteModule = vi.fn();

  beforeEach(async () => {
    // EventBus and @mfe/shell/util-federation both use the page-wide registry.
    window.__NF_REGISTRY__ = createRegistry({ maxEvents: 10 })();
    await window.__NF_REGISTRY__.register('orch.init-ready', {
      loadRemoteModule,
    });
    loadRemoteModule.mockReset();
    TestBed.configureTestingModule({ providers: [provideRouter(appRoutes)] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__NF_REGISTRY__;
  });

  it('mounts the ./Routes of mf1 under /mf1', async () => {
    loadRemoteModule.mockResolvedValue({
      default: [{ path: '', component: FakeCatalog }],
    });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/mf1', FakeCatalog);

    expect(loadRemoteModule).toHaveBeenCalledWith('mf1', './Routes');
    expect(TestBed.inject(Title).getTitle()).toBe('Katalog (mf1) · MFE Shell');
  });

  it('shows RemoteUnavailable on every path of a remote that is down', async () => {
    loadRemoteModule.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/mf2/orders', RemoteUnavailable);

    const page = harness.routeNativeElement as HTMLElement;
    expect(page.querySelector('[data-testid="remote-unavailable"]')).not.toBe(
      null,
    );
    expect(page.textContent).toContain('mf2 ist gerade nicht erreichbar');
    expect(TestBed.inject(Title).getTitle()).toBe(
      'mf2 nicht erreichbar · MFE Shell',
    );
  });

  it('redirects unknown paths to the dashboard', async () => {
    loadRemoteModule.mockResolvedValue({ default: FakeWidget });
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/unknown');

    expect(TestBed.inject(Router).url).toBe('/');
    expect(
      harness.routeNativeElement?.querySelector('[data-testid="dashboard"]'),
    ).not.toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe('Dashboard · MFE Shell');
  });
});
