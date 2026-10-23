import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
import {
  federationReady,
  loadRemoteRoutes,
  loadRemoteWidget,
} from './load-remote';

describe('load-remote', () => {
  const loadRemoteModule = vi.fn();

  beforeEach(() => {
    window.__NF_REGISTRY__ = createRegistry({ maxEvents: 1 })();
    loadRemoteModule.mockReset();
  });

  afterEach(() => {
    delete window.__NF_REGISTRY__;
  });

  const publishFederation = () =>
    window.__NF_REGISTRY__?.register('orch.init-ready', { loadRemoteModule });

  it('waits for orch.init-ready even if it is registered later', async () => {
    const ready = federationReady();
    await publishFederation();

    await expect(ready).resolves.toEqual({ loadRemoteModule });
  });

  it('loads the default export of ./Routes', async () => {
    const routes = [{ path: '' }];
    loadRemoteModule.mockResolvedValue({ default: routes });
    await publishFederation();

    await expect(loadRemoteRoutes('mf1')()).resolves.toBe(routes);
    expect(loadRemoteModule).toHaveBeenCalledWith('mf1', './Routes');
  });

  it('falls back when a remote is unavailable', async () => {
    const fallback = [{ path: '**' }];
    loadRemoteModule.mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await publishFederation();

    await expect(loadRemoteRoutes('mf2', fallback)()).resolves.toBe(fallback);
  });

  it('loads the default export of ./Widget', async () => {
    class Widget {}
    loadRemoteModule.mockResolvedValue({ default: Widget });
    await publishFederation();

    await expect(loadRemoteWidget('mf2')).resolves.toBe(Widget);
    expect(loadRemoteModule).toHaveBeenCalledWith('mf2', './Widget');
  });
});
