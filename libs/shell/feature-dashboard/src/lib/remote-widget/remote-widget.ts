import { NgComponentOutlet } from '@angular/common';
import { Component, input, resource } from '@angular/core';
import { loadRemoteWidget, type RemoteName } from '@mfe/shell/util-federation';

/** Loads the standalone component a remote exposes as `./Widget` and renders it. */
@Component({
  selector: 'shell-remote-widget',
  imports: [NgComponentOutlet],
  templateUrl: './remote-widget.html',
  styleUrl: './remote-widget.scss',
})
export class RemoteWidget {
  readonly remote = input.required<RemoteName>();

  protected readonly widget = resource({
    params: () => this.remote(),
    loader: ({ params: remote }) =>
      loadRemoteWidget(remote).catch((error: unknown) => {
        console.error(`Could not load ./Widget of remote '${remote}'`, error);
        throw error;
      }),
  });
}
