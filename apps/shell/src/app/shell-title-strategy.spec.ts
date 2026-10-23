import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, TitleStrategy } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ShellTitleStrategy } from './shell-title-strategy';

@Component({ template: '' })
class Page {}

describe('ShellTitleStrategy', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'untitled', component: Page },
          {
            path: 'mf2',
            title: 'Warenkorb',
            children: [
              { path: '', component: Page },
              { path: 'orders', title: 'Bestellungen', component: Page },
              { path: 'resolved', title: () => 'Aufgelöst', component: Page },
            ],
          },
        ]),
        { provide: TitleStrategy, useClass: ShellTitleStrategy },
      ],
    });
  });

  async function titleAt(url: string) {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url, Page);
    return TestBed.inject(Title).getTitle();
  }

  it('appends the app name to the deepest route title', async () => {
    expect(await titleAt('/mf2/orders')).toBe('Bestellungen · MFE Shell');
  });

  it('falls back to the title of a parent route', async () => {
    expect(await titleAt('/mf2')).toBe('Warenkorb · MFE Shell');
  });

  it('supports resolved titles', async () => {
    expect(await titleAt('/mf2/resolved')).toBe('Aufgelöst · MFE Shell');
  });

  it('shows only the app name when no route has a title', async () => {
    expect(await titleAt('/untitled')).toBe('MFE Shell');
  });
});
