import { type Id, newId } from './ids.ts';
import type { Money } from './money.ts';
import type { ProductId } from './product.ts';
import type { StoreId } from './store.ts';

/** The price a product had in a store on a given date. */
export interface PriceObservation {
  readonly id: Id;
  readonly productId: ProductId;
  readonly storeId: StoreId;
  readonly price: Money;
  /** Calendar date (no time): always midnight UTC. */
  readonly observedAt: Date;
}

export interface CreatePriceObservationProps {
  productId: ProductId;
  storeId: StoreId;
  price: Money;
  observedAt: Date;
}

/** Returns a copy of `date` truncated to midnight UTC (its calendar day in UTC). */
export function toCalendarDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Parses a strict ISO calendar date (YYYY-MM-DD), rejecting impossible dates like 2026-02-30. */
export function parseIsoDate(value: string): Date {
  const text = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) {
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return date;
    }
  }
  throw new Error(`Invalid date (expected YYYY-MM-DD): "${value}"`);
}

/** Formats a calendar date as YYYY-MM-DD. */
export function formatIsoDate(date: Date): string {
  return toCalendarDate(date).toISOString().slice(0, 10);
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
    observedAt: toCalendarDate(props.observedAt),
  });
}
