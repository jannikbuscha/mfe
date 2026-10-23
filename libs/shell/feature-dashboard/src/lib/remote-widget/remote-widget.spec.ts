import { Component, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { loadRemoteWidget } from '@mfe/shell/util-federation';
import { RemoteWidget } from './remote-widget';

vi.mock('@mfe/shell/util-federation', () => ({ loadRemoteWidget: vi.fn() }));

@Component({
  selector: 'shell-fake-widget',
  template: '<p data-testid="fake-widget">Fake-Widget</p>',
})
class FakeWidget {}

describe('RemoteWidget', () => {
  const load = vi.mocked(loadRemoteWidget);

  // Block bodies: a function returned from a hook would run as its teardown.
  beforeEach(() => {
    load.mockReset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function create(remote: 'mf1' | 'mf2') {
    const fixture = TestBed.createComponent(RemoteWidget);
    fixture.componentRef.setInput('remote', remote);
    const query = (testId: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(
        `[data-testid="${testId}"]`,
      );
    return { fixture, query };
  }

  it('renders the component the remote exposes as ./Widget', async () => {
    load.mockResolvedValue(FakeWidget);
    const { fixture, query } = create('mf1');

    await fixture.whenStable();

    expect(load).toHaveBeenCalledWith('mf1');
    expect(query('fake-widget')?.textContent).toBe('Fake-Widget');
    expect(query('remote-loading')).toBeNull();
    expect(query('remote-error')).toBeNull();
  });

  it('shows a loading state until the widget has been loaded', async () => {
    let resolve: (widget: Type<unknown>) => void = () => undefined;
    load.mockReturnValue(new Promise((r) => (resolve = r)));
    const { fixture, query } = create('mf2');

    fixture.detectChanges();
    expect(query('remote-loading')?.textContent).toContain('mf2');

    resolve(FakeWidget);
    await fixture.whenStable();
    expect(query('remote-loading')).toBeNull();
    expect(query('fake-widget')).not.toBeNull();
  });

  it('shows an error state when the remote is not reachable', async () => {
    load.mockRejectedValue(new Error('offline'));
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { fixture, query } = create('mf2');

    await fixture.whenStable();

    expect(query('remote-error')?.textContent?.trim()).toBe(
      'mf2 ist nicht erreichbar.',
    );
    expect(query('remote-loading')).toBeNull();
    expect(consoleError).toHaveBeenCalled();
  });
});
