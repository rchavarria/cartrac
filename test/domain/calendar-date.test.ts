import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createPriceObservation,
  formatIsoDate,
  Money,
  parseIsoDate,
  toCalendarDate,
} from '../../src/domain/index.ts';

describe('calendar dates', () => {
  it('parses ISO dates as midnight UTC', () => {
    assert.deepEqual(parseIsoDate('2026-09-30'), new Date('2026-09-30T00:00:00Z'));
    assert.deepEqual(parseIsoDate(' 2024-02-29 '), new Date('2024-02-29T00:00:00Z'));
  });

  it('rejects malformed or impossible dates', () => {
    for (const value of ['2026-02-30', '2025-02-29', '2026-13-01', '30/09/2026', '2026-9-1', '']) {
      assert.throws(() => parseIsoDate(value), /Invalid date/, value);
    }
  });

  it('formats dates as YYYY-MM-DD', () => {
    assert.equal(formatIsoDate(new Date('2026-01-05T00:00:00Z')), '2026-01-05');
    assert.equal(formatIsoDate(new Date('2026-01-05T23:59:59Z')), '2026-01-05');
  });

  it('truncates the time part and rejects invalid dates', () => {
    assert.deepEqual(
      toCalendarDate(new Date('2026-09-30T18:45:00Z')),
      new Date('2026-09-30T00:00:00Z'),
    );
    assert.throws(() => toCalendarDate(new Date('nope')), /Invalid date/);
  });

  it('price observations keep their own copy of the date', () => {
    const date = new Date('2026-09-30T10:00:00Z');
    const observation = createPriceObservation({
      productId: 'p',
      storeId: 's',
      price: Money.parse('1'),
      observedAt: date,
    });
    date.setUTCFullYear(2000);
    assert.equal(formatIsoDate(observation.observedAt), '2026-09-30');
  });
});
