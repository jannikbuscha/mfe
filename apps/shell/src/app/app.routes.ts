import { Route } from '@angular/router';
import { loadRemoteRoutes, type RemoteName } from '@mfe/shell/util-federation';
import { RemoteUnavailable } from './remote-unavailable/remote-unavailable';

/** The remote's `./Routes`, or a notice on every path if it cannot be loaded. */
function remoteRoutes(remote: RemoteName) {
  return loadRemoteRoutes(remote, [
    {
      path: '**',
      title: `${remote} nicht erreichbar`,
      component: RemoteUnavailable,
      data: { remote },
    },
  ]);
}

// ShellTitleStrategy appends the app name. The remotes title their own pages;
// the titles of 'mf1' and 'mf2' only apply where a remote route has none.
export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Dashboard',
    loadComponent: () =>
      import('@mfe/shell/feature-dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'mf1',
    title: 'Katalog',
    loadChildren: remoteRoutes('mf1'),
  },
  {
    path: 'mf2',
    title: 'Warenkorb',
    loadChildren: remoteRoutes('mf2'),
  },
  { path: '**', redirectTo: '' },
];
