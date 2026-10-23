import { initFederation } from '@angular-architects/native-federation';
import { createRegistry } from '@softarc/native-federation-orchestrator/registry';
// Type-only (erased at build time): declares `window.__NF_REGISTRY__`.
import type {} from '@mfe/shared/util-event-registry';

// This file only runs when MF1 is served standalone. Inside the shell, only
// the exposed modules are loaded and they use the shell's registry.

// No runtime imports of Angular or @mfe/* libraries in this file: they are
// shared through the import map, which only exists after initFederation().
window.__NF_REGISTRY__ ??= Object.freeze(
  createRegistry({ maxEvents: 50, maxStreams: 50, removePercentage: 0.5 })(),
);

initFederation(
  {},
  {
    hostRemoteEntry: { url: './remoteEntry.json' },
  },
)
  .then((federation) =>
    window.__NF_REGISTRY__?.register('orch.init-ready', { ...federation }),
  )
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));
