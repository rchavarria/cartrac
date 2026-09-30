import type { ProductDescription } from './product.ts';

/**
 * Domain service that decides whether two product descriptions refer to the same product,
 * e.g. "Leche Entera Hacendado 1L" vs "leche entera hacendado 1 l".
 */
export class ProductMatcher {
  readonly #threshold: number;

  constructor(threshold = 0.85) {
    if (threshold <= 0 || threshold > 1) {
      throw new Error(`Threshold must be in (0, 1]: ${threshold}`);
    }
    this.#threshold = threshold;
  }

  /** Lowercase, remove accents and punctuation, collapse whitespace. */
  static normalize(text: string): string {
    return text
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  static key(product: ProductDescription): string {
    return ProductMatcher.normalize(
      [product.name, product.brand, product.unit].filter(Boolean).join(' '),
    );
  }

  /** Sørensen–Dice coefficient over character bigrams of the normalized keys (0..1). */
  similarity(a: ProductDescription, b: ProductDescription): number {
    return diceCoefficient(
      ProductMatcher.key(a).replaceAll(' ', ''),
      ProductMatcher.key(b).replaceAll(' ', ''),
    );
  }

  matches(a: ProductDescription, b: ProductDescription): boolean {
    return this.similarity(a, b) >= this.#threshold;
  }

  findBestMatch<T extends ProductDescription>(
    candidate: ProductDescription,
    existing: Iterable<T>,
  ): T | undefined {
    let best: T | undefined;
    let bestScore = this.#threshold;
    for (const product of existing) {
      const score = this.similarity(candidate, product);
      if (score >= bestScore) {
        best = product;
        bestScore = score;
      }
    }
    return best;
  }
}

function bigrams(text: string): Map<string, number> {
  const result = new Map<string, number>();
  for (let i = 0; i < text.length - 1; i++) {
    const gram = text.slice(i, i + 2);
    result.set(gram, (result.get(gram) ?? 0) + 1);
  }
  return result;
}

function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const gramsA = bigrams(a);
  const gramsB = bigrams(b);
  let intersection = 0;
  for (const [gram, count] of gramsA) {
    intersection += Math.min(count, gramsB.get(gram) ?? 0);
  }
  return (2 * intersection) / (a.length - 1 + (b.length - 1));
}
