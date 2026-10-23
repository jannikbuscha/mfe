import type { Type } from '@angular/core';
import type { Routes } from '@angular/router';
import { eventRegistry } from '@mfe/shared/util-event-registry';
import type { NativeFederationResult } from '@softarc/native-federation-orchestrator';

/** Remotes listed in `apps/shell/public/federation.manifest.json`. */
export type RemoteName = 'mf1' | 'mf2';

/**
 * Resolves with the orchestrator's loaders. `main.ts` registers them as the
 * `orch.init-ready` resource; `onReady` also fires for late subscribers, so
 * there is no race with `initFederation`.
 */
export function federationReady(): Promise<NativeFederationResult> {
  return new Promise((resolve) =>
    eventRegistry().onReady('orch.init-ready', resolve),
  );
}

export async function loadRemoteModule<T>(
  remoteName: RemoteName,
  exposedModule: string,
): Promise<T> {
  const { loadRemoteModule } = await federationReady();
  return loadRemoteModule<T>(remoteName, exposedModule);
}

/** Contract of every remote's `./Routes` module. */
export interface RemoteRoutesModule {
  default: Routes;
}

/** Contract of every remote's `./Widget` module. */
export interface RemoteWidgetModule {
  default: Type<unknown>;
}

/** Loads the standalone component a remote exposes as `./Widget`. */
export function loadRemoteWidget(
  remoteName: RemoteName,
): Promise<Type<unknown>> {
  return loadRemoteModule<RemoteWidgetModule>(remoteName, './Widget').then(
    (m) => m.default,
  );
}

/**
 * `loadChildren` factory for a remote's `./Routes`. If the remote cannot be
 * loaded (e.g. it is not running), `fallback` routes are used instead of
 * failing the navigation.
 */
export function loadRemoteRoutes(
  remoteName: RemoteName,
  fallback: Routes = [],
): () => Promise<Routes> {
  return () =>
    loadRemoteModule<RemoteRoutesModule>(remoteName, './Routes').then(
      (m) => m.default,
      (error: unknown) => {
        console.error(`Could not load routes of remote '${remoteName}'`, error);
        return fallback;
      },
    );
}
