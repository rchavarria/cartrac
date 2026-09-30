import type { PriceObservation, ProductId } from '../domain/index.ts';

export interface PriceRepository {
  save(observation: PriceObservation): Promise<void>;
  /** Observations of the given products, most recent first. */
  findByProducts(productIds: readonly ProductId[]): Promise<PriceObservation[]>;
  findAll(): Promise<PriceObservation[]>;
}
