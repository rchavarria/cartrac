import { type Id, newId } from './ids.ts';

export type ProductId = Id;

export interface Product {
  readonly id: ProductId;
  readonly name: string;
  readonly brand: string | null;
  /** Free-form unit / package format, e.g. "1 L", "500 g", "6 x 33 cl". */
  readonly unit: string | null;
}

export type ProductDescription = Pick<Product, 'name' | 'brand' | 'unit'>;

export interface CreateProductProps {
  name: string;
  brand?: string | null | undefined;
  unit?: string | null | undefined;
}

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export function createProduct(props: CreateProductProps, id: ProductId = newId()): Product {
  const name = clean(props.name);
  if (!name) {
    throw new Error('Product name cannot be empty');
  }
  return Object.freeze({ id, name, brand: clean(props.brand), unit: clean(props.unit) });
}
