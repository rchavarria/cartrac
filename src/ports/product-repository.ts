import type { Product, ProductId } from '../domain/index.ts';

export interface ProductRepository {
  save(product: Product): Promise<void>;
  findById(id: ProductId): Promise<Product | undefined>;
  /** Free-text search over name, brand and unit (accent and case insensitive). */
  search(query: string): Promise<Product[]>;
  findAll(): Promise<Product[]>;
}
