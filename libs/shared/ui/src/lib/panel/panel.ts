import { Component, input } from '@angular/core';

export type PanelAccent = 'shell' | 'mf1' | 'mf2' | 'neutral';

/**
 * Card that frames a micro frontend (or a part of it). The accent tells at a
 * glance which application rendered the content.
 */
@Component({
  selector: 'ui-panel',
  templateUrl: './panel.html',
  styleUrl: './panel.scss',
  host: { '[attr.data-accent]': 'accent()' },
})
export class Panel {
  readonly heading = input.required<string>();
  readonly caption = input<string>();
  readonly accent = input<PanelAccent>('neutral');
}
