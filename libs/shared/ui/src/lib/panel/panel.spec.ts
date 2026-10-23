import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Panel } from './panel';

@Component({
  imports: [Panel],
  template: `
    <ui-panel heading="Katalog" caption="mf1 · ./Widget" accent="mf1">
      <button uiPanelActions>Aktion</button>
      <p>Inhalt</p>
    </ui-panel>
  `,
})
class Host {}

describe('Panel', () => {
  it('renders heading, caption, actions, content and accent', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const panel = fixture.nativeElement.querySelector(
      'ui-panel',
    ) as HTMLElement;

    expect(panel.getAttribute('data-accent')).toBe('mf1');
    expect(panel.querySelector('h2')?.textContent).toBe('Katalog');
    expect(panel.querySelector('.panel__caption')?.textContent).toBe(
      'mf1 · ./Widget',
    );
    expect(panel.querySelector('header button')?.textContent).toBe('Aktion');
    expect(panel.querySelector('.panel__body p')?.textContent).toBe('Inhalt');
  });
});
