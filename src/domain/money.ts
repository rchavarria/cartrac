/**
 * Immutable monetary amount stored in minor units (cents) to avoid floating point errors.
 */
export class Money {
  readonly cents: number;
  readonly currency: string;

  private constructor(cents: number, currency: string) {
    if (!Number.isSafeInteger(cents) || cents < 0) {
      throw new Error(`Invalid money amount (cents): ${cents}`);
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`Invalid ISO 4217 currency code: ${currency}`);
    }
    this.cents = cents;
    this.currency = currency;
  }

  static fromCents(cents: number, currency = 'EUR'): Money {
    return new Money(cents, currency.trim().toUpperCase());
  }

  /** Parses decimal amounts such as "1.25", "1,25" or "3". */
  static parse(amount: string | number, currency = 'EUR'): Money {
    const text = String(amount).trim().replace(',', '.');
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
    if (!match) {
      throw new Error(`Invalid money amount: "${amount}"`);
    }
    const units = Number(match[1]);
    const decimals = Number((match[2] ?? '').padEnd(2, '0'));
    return Money.fromCents(units * 100 + decimals, currency);
  }

  compare(other: Money): number {
    this.#assertSameCurrency(other);
    return this.cents - other.cents;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.cents === other.cents;
  }

  /** Percentage by which this amount exceeds `reference` (0 when equal). */
  percentAbove(reference: Money): number {
    this.#assertSameCurrency(reference);
    if (reference.cents === 0) return 0;
    return ((this.cents - reference.cents) / reference.cents) * 100;
  }

  toDecimalString(): string {
    const units = Math.trunc(this.cents / 100);
    const decimals = String(this.cents % 100).padStart(2, '0');
    return `${units}.${decimals}`;
  }

  toString(): string {
    return `${this.toDecimalString()} ${this.currency}`;
  }

  #assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
