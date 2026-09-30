import { type Id, newId } from './ids.ts';

export type StoreId = Id;

/** A supermarket (or any shop) where prices are observed. */
export interface Store {
  readonly id: StoreId;
  readonly name: string;
}

export function createStore(name: string, id: StoreId = newId()): Store {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Store name cannot be empty');
  }
  return Object.freeze({ id, name: trimmed });
}
