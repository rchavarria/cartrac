import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Money } from '../../src/domain/index.ts';

describe('Money', () => {
  it('parses decimal amounts with dot or comma', () => {
    assert.equal(Money.parse('1.25').cents, 125);
    assert.equal(Money.parse('1,5').cents, 150);
    assert.equal(Money.parse(3).cents, 300);
  });

  it('rejects invalid amounts and currencies', () => {
    assert.throws(() => Money.parse('abc'));
    assert.throws(() => Money.parse('-1'));
    assert.throws(() => Money.parse('1.234'));
    assert.throws(() => Money.parse('1', 'EURO'));
  });

  it('formats as decimal string', () => {
    assert.equal(Money.fromCents(105, 'eur').toString(), '1.05 EUR');
  });

  it('computes percentage above a reference', () => {
    assert.equal(Money.parse('1.10').percentAbove(Money.parse('1.00')).toFixed(1), '10.0');
    assert.throws(() => Money.parse('1', 'USD').compare(Money.parse('1', 'EUR')));
  });
});
