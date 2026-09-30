import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createProduct, ProductMatcher } from '../../src/domain/index.ts';

describe('ProductMatcher', () => {
  const matcher = new ProductMatcher();

  it('normalizes accents, case and punctuation', () => {
    assert.equal(ProductMatcher.normalize('  Café  Molido, NATURAL! '), 'cafe molido natural');
  });

  it('matches the same product written differently', () => {
    const a = createProduct({ name: 'Leche Entera', brand: 'Hacendado', unit: '1L' });
    const b = createProduct({ name: 'leche entera', brand: 'HACENDADO', unit: '1 l' });
    assert.ok(matcher.matches(a, b));
  });

  it('does not match different products', () => {
    const a = createProduct({ name: 'Leche Entera', brand: 'Hacendado', unit: '1L' });
    const b = createProduct({ name: 'Leche Desnatada', brand: 'Pascual', unit: '1L' });
    assert.ok(!matcher.matches(a, b));
  });

  it('finds the best match among existing products', () => {
    const existing = [
      createProduct({ name: 'Aceite de oliva virgen extra', unit: '1 L' }),
      createProduct({ name: 'Aceite de girasol', unit: '1 L' }),
    ];
    const found = matcher.findBestMatch(
      { name: 'Aceite oliva virgen extra', brand: null, unit: '1L' },
      existing,
    );
    assert.equal(found, existing[0]);
  });
});
