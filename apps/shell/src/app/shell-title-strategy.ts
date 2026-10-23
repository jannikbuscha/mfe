import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const APP_TITLE = 'MFE Shell';

/**
 * `<page> · MFE Shell`, where the page is the deepest route title. The
 * remotes' routes only name their pages, so they also fit standalone.
 */
@Injectable()
export class ShellTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    this.title.setTitle(page ? `${page} · ${APP_TITLE}` : APP_TITLE);
  }
}
