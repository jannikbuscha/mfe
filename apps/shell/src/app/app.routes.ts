import { Route } from '@angular/router';
import { loadRemoteRoutes, type RemoteName } from '@mfe/shell/util-federation';
import { RemoteUnavailable } from './remote-unavailable/remote-unavailable';

/** The remote's `./Routes`, or a notice on every path if it cannot be loaded. */
function remoteRoutes(remote: RemoteName) {
  return loadRemoteRoutes(remote, [
    {
      path: '**',
      title: `${remote} nicht erreichbar · MFE Shell`,
      component: RemoteUnavailable,
      data: { remote },
    },
  ]);
}

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Dashboard · MFE Shell',
    loadComponent: () =>
      import('@mfe/shell/feature-dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'mf1',
    title: 'Katalog (mf1) · MFE Shell',
    loadChildren: remoteRoutes('mf1'),
  },
  {
    path: 'mf2',
    title: 'Warenkorb (mf2) · MFE Shell',
    loadChildren: remoteRoutes('mf2'),
  },
  { path: '**', redirectTo: '' },
];
