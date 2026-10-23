import type { CartProduct } from '@mfe/shared/data-access-cart';
import type { ProductSelected } from '@mfe/shared/util-event-registry';
import type { Product } from '@mfe/mf1/data-access-catalog';

type ProductRef = Pick<Product, 'id' | 'name' | 'price'>;

// Registry payloads must be plain, structured-clone-able objects: copy only
// the fields of the contract instead of passing the catalog object along.

export function toCartProduct({ id, name, price }: ProductRef): CartProduct {
  return { productId: id, name, price };
}

export function toProductSelected({
  id,
  name,
}: Pick<Product, 'id' | 'name'>): ProductSelected {
  return { productId: id, name };
}
