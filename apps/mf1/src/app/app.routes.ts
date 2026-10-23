import { Route } from '@angular/router';

// Standalone, MF1 loads exactly the module the shell loads as `./Routes`.
export const appRoutes: Route[] = [
  { path: '', loadChildren: () => import('./remote-entry/entry.routes') },
];
