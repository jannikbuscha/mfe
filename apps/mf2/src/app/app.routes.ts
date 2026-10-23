import { Route } from '@angular/router';

// Standalone, MF2 mounts its exposed routes at the root, exactly as the shell
// mounts them at /mf2.
export const appRoutes: Route[] = [
  { path: '', loadChildren: () => import('./remote-entry/entry.routes') },
];
