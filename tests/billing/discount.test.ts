import { test } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount, calculateTax } from "../../src/billing/discount";

test("applyDiscount reduces amount by percent", () => {
  assert.equal(applyDiscount(200, 10), 180);
  assert.equal(applyDiscount(100, 50), 50);
  assert.equal(applyDiscount(100, 0), 100);
  assert.equal(applyDiscount(100, 100), 0);
});

test("applyDiscount throws on invalid percent", () => {
  assert.throws(() => applyDiscount(100, -1), RangeError);
  assert.throws(() => applyDiscount(100, 101), RangeError);
});

test("calculateTax returns correct tax amount", () => {
  assert.equal(calculateTax(200, 0.1), 20);
  assert.equal(calculateTax(100, 0), 0);
});

test("calculateTax throws on negative rate", () => {
  assert.throws(() => calculateTax(100, -0.1), RangeError);
});
