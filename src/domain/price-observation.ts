import { type Id, newId } from './ids.ts';
import type { Money } from './money.ts';
import type { ProductId } from './product.ts';
import type { StoreId } from './store.ts';

/** Calendar date in ISO format: YYYY-MM-DD. */
export type IsoDate = string;

/** The price a product had in a store on a given date. */
export interface PriceObservation {
  readonly id: Id;
  readonly productId: ProductId;
  readonly storeId: StoreId;
  readonly price: Money;
  readonly observedAt: IsoDate;
}

export interface CreatePriceObservationProps {
  productId: ProductId;
  storeId: StoreId;
  price: Money;
  observedAt: string;
}

export function assertIsoDate(value: string): IsoDate {
  const date = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error(`Invalid date (expected YYYY-MM-DD): "${value}"`);
  }
  return date;
}

export function createPriceObservation(
  props: CreatePriceObservationProps,
  id: Id = newId(),
): PriceObservation {
  return Object.freeze({
    id,
    productId: props.productId,
    storeId: props.storeId,
    price: props.price,
    observedAt: assertIsoDate(props.observedAt),
  });
}
