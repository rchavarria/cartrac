import type { Store, StoreId } from '../domain/index.ts';

export interface StoreRepository {
  save(store: Store): Promise<void>;
  findById(id: StoreId): Promise<Store | undefined>;
  /** Case-insensitive exact name lookup. */
  findByName(name: string): Promise<Store | undefined>;
  findAll(): Promise<Store[]>;
}
