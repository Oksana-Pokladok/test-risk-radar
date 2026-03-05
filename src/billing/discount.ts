export function applyDiscount(amount: number, percent: number): number {
  if (percent < 0 || percent > 100) throw new RangeError("percent must be 0–100");
  return amount * (1 - percent / 100);
}

export function calculateTax(amount: number, rate: number): number {
  if (rate < 0) throw new RangeError("rate must be non-negative");
  return amount * rate;
}
