import type { NativeFederationResult } from '@softarc/native-federation-orchestrator';

/**
 * The cross-MFE contract. Micro frontends never import each other; they only
 * agree on these event names and payload shapes, which travel through
 * `window.__NF_REGISTRY__`.
 *
 * Every payload must be structured-clone-able (no functions, class instances
 * or DOM nodes): the registry clones values for `update()` and for replay.
 */

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  items: CartItem[];
  total: number;
  placedAt: number;
}

export interface ProductSelected {
  productId: string;
  name: string;
}

/** Event streams, delivered through `emit` / `update` / `on`. */
export interface MfeEvents {
  /**
   * State channel (BehaviorSubject-style): the complete cart. Written with
   * `update()`, read with the default `replay: 1`, so a late-joining
   * subscriber immediately sees the current cart.
   */
  'cart.items': CartItem[];
  /** Event log: an order was placed. Read with `replay: N` for a history. */
  'cart.checked-out': Order;
  /** Event log: a product was opened in the catalog (MF1). */
  'catalog.product-selected': ProductSelected;
}

/** Resources (fire-and-latch), delivered through `register` / `onReady`. */
export interface MfeResources {
  /** Published by every `main.ts` once `initFederation` has resolved. */
  'orch.init-ready': NativeFederationResult;
}

export type MfeEventType = keyof MfeEvents;
export type MfeResourceType = keyof MfeResources;
