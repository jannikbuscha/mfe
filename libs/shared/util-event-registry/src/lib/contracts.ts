import type { NativeFederationResult } from '@softarc/native-federation-orchestrator';

/**
 * The cross-MFE contract. Micro frontends never import each other; they only
 * agree on these event names and payload shapes, which travel through
 * `window.__NF_REGISTRY__`.
 *
 * Every payload must be structured-clone-able (no functions, class instances
 * or DOM nodes): the registry clones values for `update()` and for replay.
 * Live events, however, reach every subscriber in every micro frontend as the
 * same object, hence the read-only types: never mutate a payload in place.
 */

export interface CartItem {
  readonly productId: string;
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export interface Order {
  readonly orderId: string;
  readonly items: readonly CartItem[];
  readonly total: number;
  readonly placedAt: number;
}

export interface ProductSelected {
  readonly productId: string;
  readonly name: string;
}

/** Event streams, delivered through `emit` / `update` / `on`. */
export interface MfeEvents {
  /**
   * State channel (BehaviorSubject-style): the complete cart. Written with
   * `update()`, read with the default `replay: 1`, so a late-joining
   * subscriber immediately sees the current cart.
   */
  'cart.items': readonly CartItem[];
  /** Event log: an order was placed. Read with `replay: N` for a history. */
  'cart.checked-out': Order;
  /**
   * Event from MF1: a product was opened or selected. The widgets read the
   * latest one (`replay: 1`), the shell's event monitor a history (`replay: N`).
   */
  'catalog.product-selected': ProductSelected;
}

/** Resources (fire-and-latch), delivered through `register` / `onReady`. */
export interface MfeResources {
  /** Published by every `main.ts` once `initFederation` has resolved. */
  'orch.init-ready': NativeFederationResult;
}

export type MfeEventType = keyof MfeEvents;
export type MfeResourceType = keyof MfeResources;
