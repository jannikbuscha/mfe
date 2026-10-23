import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Panel } from '@mfe/shared/ui';

/**
 * Fallback route for `/mf1/**` and `/mf2/**` when the remote's `./Routes`
 * could not be loaded. `data.remote` names the remote.
 */
@Component({
  selector: 'shell-remote-unavailable',
  imports: [Panel, RouterLink],
  templateUrl: './remote-unavailable.html',
  styleUrl: './remote-unavailable.scss',
})
export class RemoteUnavailable {
  protected readonly remote: string =
    inject(ActivatedRoute).snapshot.data['remote'];
}
