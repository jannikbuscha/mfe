import {
  withNativeFederation,
  fromPackageJson,
  mappingsFromWorkspace,
} from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'mf2',

  // The public API of this micro frontend. The shell relies on the default
  // exports: Routes for its router, a standalone component for the dashboard.
  exposes: {
    './Routes': './apps/mf2/src/app/remote-entry/entry.routes.ts',
    './Widget': './apps/mf2/src/app/remote-entry/widget.ts',
  },

  shared: fromPackageJson({
    singleton: true,
    strictVersion: true,
    requiredVersion: 'auto',
    build: 'package',
  })
    .patch(['@angular/*'], { includeSecondaries: { keepAll: true } })
    .get(),

  // Only the scope:shared libraries are shared at runtime (one instance for
  // the shell and all remotes). App-specific libraries are bundled.
  sharedMappings: mappingsFromWorkspace({ singleton: true })
    .filter(['@mfe/shared/*'])
    .get(),

  skip: [
    // Entry points of @angular/platform-browser that need the (not
    // installed) @angular/animations package.
    '@angular/platform-browser/animations',
    '@angular/platform-browser/animations/async',
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],

  // https://native-federation.com/docs/v4/angular-adapter/configuration/
  features: {
    denseChunking: true,
    denseExternals: true,
    strictImports: false,
  },
});
