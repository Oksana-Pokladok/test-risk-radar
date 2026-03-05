import { test } from "node:test";
import assert from "node:assert/strict";
import { createInvoice, markPaid } from "../../src/billing/invoice";

test("createInvoice sets amount and paid=false", () => {
  const inv = createInvoice(100);
  assert.equal(inv.amount, 100);
  assert.equal(inv.paid, false);
});

test("createInvoice generates unique ids", () => {
  const a = createInvoice(1);
  const b = createInvoice(1);
  assert.notEqual(a.id, b.id);
});

test("markPaid returns invoice with paid=true", () => {
  const inv = createInvoice(50);
  const paid = markPaid(inv);
  assert.equal(paid.paid, true);
  assert.equal(paid.amount, 50);
  assert.equal(paid.id, inv.id);
});

test("markPaid does not mutate the original", () => {
  const inv = createInvoice(50);
  markPaid(inv);
  assert.equal(inv.paid, false);
});
