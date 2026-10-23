# MFE – Nx 24 · Angular 22 · Native Federation

Ein Nx-Monorepo mit drei Angular-22-Anwendungen:

| App     | Rolle                                    | Port |
| ------- | ---------------------------------------- | ---- |
| `shell` | Host (dynamic host, lädt die Remotes)    | 4200 |
| `mf1`   | Remote „Katalog“ (Produkte)              | 4201 |
| `mf2`   | Remote „Warenkorb“ (Cart & Bestellungen) | 4202 |

Die Micro Frontends werden per **Native Federation** (`@angular-architects/native-federation` 22.2 mit dem Orchestrator `@softarc/native-federation-orchestrator` 4.8) eingebunden und kommunizieren ausschließlich über die **NF Event Registry** (`window.__NF_REGISTRY__`). Sie importieren sich nie gegenseitig.

Die Shell zeigt beide MFs

- **nebeneinander** auf dem Dashboard (`/`) – jedes Remote liefert dafür ein `./Widget`, und
- **über den Router** (`/mf1`, `/mf1/:productId`, `/mf2`, `/mf2/orders`) – jedes Remote liefert dafür seine `./Routes`.

```
                       ┌──────────── window.__NF_REGISTRY__ ────────────┐
                       │  orch.init-ready  (Resource, register/onReady)  │
                       │  cart.items       (State-Channel, update/on)    │
                       │  cart.checked-out (Event-Log, emit/on replay N) │
                       │  catalog.product-selected (Event, emit/on)      │
                       └──────▲──────────────────▲──────────────────▲────┘
                              │                  │                  │
   ┌─────────────── shell :4200 ──────────────┐  │                  │
   │ main.ts: createRegistry() + initFederation│  │                  │
   │ Dashboard:  [ mf1 ./Widget | mf2 ./Widget ]──┘                  │
   │ Router:     /mf1 → mf1 ./Routes, /mf2 → mf2 ./Routes ───────────┘
   └───────────────────────────────────────────┘
          ▲ federation.manifest.json
          ├── http://localhost:4201/remoteEntry.json  (mf1)
          └── http://localhost:4202/remoteEntry.json  (mf2)
```

## Schnellstart

Voraussetzung: **Node.js ≥ 24.16** (siehe `.nvmrc`; Angular 22 verlangt `^22.22.3 || ^24.15`, der NF-Orchestrator `>=24.16`).

```bash
npm ci
npm start            # = nx run-many -t serve -p shell,mf1,mf2
```

Dann http://localhost:4200 öffnen.

Einzeln starten:

```bash
npx nx serve mf1     # Remote standalone: http://localhost:4201
npx nx serve mf2     # Remote standalone: http://localhost:4202
npx nx serve shell   # Host:              http://localhost:4200
```

Jedes Remote läuft auch **standalone**: Seine `main.ts` legt dann eine eigene Registry an, und die App nutzt dieselben `./Routes` wie die Shell.

Weitere Befehle:

```bash
npm run build        # nx run-many -t build
npm test             # nx run-many -t test   (Vitest)
npm run lint         # nx run-many -t lint   (inkl. Module Boundaries)
npm run e2e          # nx e2e shell-e2e      (Playwright, startet alle drei Apps)
npx nx graph         # Projekt-Graph
```

## Workspace-Struktur

```
apps/
  shell/                 Host: Layout, Navigation, Routen, main.ts (Registry + initFederation)
  shell-e2e/             Playwright-Tests gegen Shell + beide Remotes
  mf1/                   Remote „Katalog“, exposes ./Routes und ./Widget (src/app/remote-entry)
  mf2/                   Remote „Warenkorb“, exposes ./Routes und ./Widget (src/app/remote-entry)
libs/
  shared/
    util-event-registry/    Event-Contract (MfeEvents, MfeResources) + typisierter Zugriff auf window.__NF_REGISTRY__
    data-access-event-bus/  Angular-Fassade: EventBus (Signals, Observable, auto-unsubscribe)
    data-access-cart/       CartStore auf dem State-Channel cart.items
    ui/                     Panel, EventLog, EuroPipe
  shell/
    feature-dashboard/      Dashboard: beide Remote-Widgets nebeneinander + Event-Monitor
    util-federation/        loadRemoteRoutes / loadRemoteWidget über orch.init-ready
  mf1/
    feature-catalog/        Katalog-Seite, Produktdetail, Widget
    data-access-catalog/    Produktdaten
    ui-catalog/             ProductCard
  mf2/
    feature-cart/           Warenkorb-Seite, Bestellungen, Widget
```

### Nx-Konventionen

Libraries folgen dem üblichen Nx-Schema `libs/<scope>/<type>-<name>` mit Tags, die `@nx/enforce-module-boundaries` (siehe `eslint.config.mjs`) durchsetzt:

| Tag                | darf abhängen von                      |
| ------------------ | -------------------------------------- |
| `scope:shell`      | `scope:shell`, `scope:shared`          |
| `scope:mf1`        | `scope:mf1`, `scope:shared`            |
| `scope:mf2`        | `scope:mf2`, `scope:shared`            |
| `scope:shared`     | `scope:shared`                         |
| `type:app`         | `feature`, `ui`, `data-access`, `util` |
| `type:feature`     | `feature`, `ui`, `data-access`, `util` |
| `type:ui`          | `ui`, `util`                           |
| `type:data-access` | `data-access`, `util`                  |
| `type:util`        | `util`                                 |

Damit kann MF1 technisch nicht auf Code von MF2 (oder der Shell) zugreifen – die einzige Verbindung ist der Event-Contract in `@mfe/shared/util-event-registry`.

## Native Federation

- Die Projekte wurden mit `nx g @angular-architects/native-federation:init` eingerichtet (Shell als `dynamic-host`, MFs als `remote`). Das Target `build`/`serve` nutzt den NF-Builder, das ursprüngliche Angular-Build liegt in `esbuild`/`serve-original`.
- Die Shell lädt die Remotes aus `apps/shell/public/federation.manifest.json` (für andere Umgebungen einfach die URLs austauschen).
- Remotes exponieren (siehe `apps/mf*/federation.config.mjs`):
  - `./Routes` → `src/app/remote-entry/entry.routes.ts` (`export default` Routes)
  - `./Widget` → `src/app/remote-entry/widget.ts` (`export default` Standalone-Component)
- Geteilt werden Angular, RxJS und – per `sharedMappings: mappingsFromWorkspace().filter(['@mfe/shared/*'])` – nur die `scope:shared`-Libraries (Singletons). App-spezifische Libraries werden ins jeweilige Bundle gebaut.
- `@angular/platform-browser/animations*` steht auf der `skip`-Liste, weil `@angular/animations` nicht installiert ist.

## NF Event Registry

### Erzeugung (Option B: eigener Orchestrator-Host)

`apps/shell/src/main.ts` legt die Registry an, **bevor** irgendein Consumer-Code läuft, und veröffentlicht danach die Loader des Orchestrators als Resource `orch.init-ready`:

```ts
window.__NF_REGISTRY__ ??= Object.freeze(
  createRegistry({ maxEvents: 50, maxStreams: 50, removePercentage: 0.5 })(),
);

initFederation('federation.manifest.json', {
  hostRemoteEntry: { url: './remoteEntry.json' },
})
  .then((federation) =>
    window.__NF_REGISTRY__?.register('orch.init-ready', { ...federation }),
  )
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'));
```

`main.ts` importiert zur Laufzeit weder Angular noch `@mfe/*`-Libraries: Diese werden über die Import Map geteilt, die erst nach `initFederation()` existiert.

Die Shell lädt Remotes nicht über das (deprecated) globale `loadRemoteModule`, sondern holt sich die Loader per `onReady('orch.init-ready', …)` aus der Registry (`@mfe/shell/util-federation`). Da Resources „latchen“, gibt es kein Race mit `initFederation`.

### Event-Contract

Definiert in `libs/shared/util-event-registry/src/lib/contracts.ts`:

| Typ                        | Art                                | Producer  | Consumer                                              |
| -------------------------- | ---------------------------------- | --------- | ----------------------------------------------------- |
| `orch.init-ready`          | Resource (`register` / `onReady`)  | `main.ts` | Shell (Remote-Loader)                                 |
| `cart.items`               | State-Channel (`update`, replay 1) | MF1, MF2  | MF1 (Mengen), MF2 (Warenkorb), Shell (Badge), Monitor |
| `cart.checked-out`         | Event-Log (`emit`, replay N)       | MF2       | MF2 (Bestellungen, Backfill 20), Monitor              |
| `catalog.product-selected` | Event (`emit`, replay 1 / N)       | MF1       | MF2 („Zuletzt angesehen“), Monitor                    |

Gut sichtbar wird das Verhalten der Registry beim Wechsel über den Router: Legt man unter `/mf1` Produkte in den Warenkorb und wechselt dann zu `/mf2`, wird MF2 erst jetzt geladen – und sieht trotzdem sofort den aktuellen Warenkorb (Replay des State-Channels). Die Bestellübersicht `/mf2/orders` zeigt per Backfill auch Bestellungen, die vor dem Öffnen der Seite aufgegeben wurden.

### Angular-Integration

`EventBus` (`@mfe/shared/data-access-event-bus`) kapselt die Registry für Angular:

```ts
private readonly bus = inject(EventBus);

readonly cart = this.bus.state('cart.items');                          // Signal, replay 1
readonly orders = this.bus.history('cart.checked-out', { limit: 20 }); // Signal, Backfill
this.bus.update('cart.items', (items = []) => [...items, item]);
this.bus.emit('catalog.product-selected', { productId, name });
```

Abos enden automatisch mit der Komponente/dem Service (`DestroyRef`). In Tests wird statt `window.__NF_REGISTRY__` per `EVENT_REGISTRY`-Token eine eigene `createRegistry()`-Instanz injiziert.

## Ein weiteres Remote hinzufügen

1. `npx nx g @nx/angular:application --directory=apps/mf3 --name=mf3 --prefix=mf3 --bundler=esbuild --style=scss --tags=scope:mf3,type:app`
2. `npx nx g @angular-architects/native-federation:init --project=mf3 --port=4203 --type=remote`
3. `main.ts` und `federation.config.mjs` wie bei `mf1` anpassen (Registry, `./Routes`, `./Widget`, `sharedMappings`, `skip`).
4. Eintrag in `apps/shell/public/federation.manifest.json`, `RemoteName` in `@mfe/shell/util-federation` erweitern, Route in `apps/shell/src/app/app.routes.ts` ergänzen.
5. `scope:mf3`-Regel in `eslint.config.mjs` ergänzen und ggf. neue Events in `contracts.ts` definieren.
