import { initFederation } from '@angular-architects/native-federation';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
// Type-only (erased at build time): declares `window.__NF_REGISTRY__`.
import type {} from '@mfe/shared/util-event-registry';

// No runtime imports of Angular or @mfe/* libraries in this file: they are
// shared through the import map, which only exists after initFederation().

// 1. Create the event registry before any consumer code runs. Remotes loaded
//    into the shell use this instance; it is the only channel they share.
window.__NF_REGISTRY__ ??= Object.freeze(
  createRegistry({ maxEvents: 50, maxStreams: 50, removePercentage: 0.5 })(),
);

// 2. Load the remotes listed in the manifest and publish the orchestrator's
//    loaders as the `orch.init-ready` resource (see @mfe/shell/util-federation).
initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
})
  .then((federation) =>
    window.__NF_REGISTRY__?.register('orch.init-ready', { ...federation }),
  )
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
