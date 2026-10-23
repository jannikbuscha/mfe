import { initFederation } from '@angular-architects/native-federation';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
// Type-only (erased at build time): declares `window.__NF_REGISTRY__`.
import type {} from '@mfe/shared/util-event-registry';
import { reachableRemotes } from './reachable-remotes';

// No runtime imports of Angular or @mfe/* libraries in this file: they are
// shared through the import map, which only exists after initFederation().

// 1. Create the event registry before any consumer code runs. Remotes loaded
//    into the shell use this instance; it is the only channel they share.
window.__NF_REGISTRY__ ??= Object.freeze(
  createRegistry({ maxEvents: 50, maxStreams: 50, removePercentage: 0.5 })(),
);

// 2. Load the remotes from the manifest (skipping unreachable ones, so they
//    cannot block the shell) and publish the orchestrator's loaders as the
//    `orch.init-ready` resource (see @mfe/shell/util-federation). Without a
//    manifest the shell still starts, just without remotes.
reachableRemotes('federation.manifest.json')
  .catch((err) => {
    console.error('Could not load the federation manifest', err);
    return {};
  })
  .then((remotes) =>
    initFederation(remotes, { hostRemoteEntry: { url: './remoteEntry.json' } }),
  )
  .then((federation) =>
    window.__NF_REGISTRY__?.register('orch.init-ready', { ...federation }),
  )
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
