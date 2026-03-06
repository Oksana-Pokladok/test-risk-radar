import { test } from "node:test";
import assert from "node:assert/strict";
import { can } from "../../src/auth/permissions";

test("admin can read, write, and delete", () => {
  assert.equal(can("admin", "read"), true);
  assert.equal(can("admin", "write"), true);
  assert.equal(can("admin", "delete"), true);
});

test("editor can read and write but not delete", () => {
  assert.equal(can("editor", "read"), true);
  assert.equal(can("editor", "write"), true);
  assert.equal(can("editor", "delete"), false);
});

test("viewer can only read", () => {
  assert.equal(can("viewer", "read"), true);
  assert.equal(can("viewer", "write"), false);
  assert.equal(can("viewer", "delete"), false);
});

test("unknown action returns false", () => {
  assert.equal(can("admin", "publish"), false);
});

test("editor can access billing", () => {
  assert.equal(can("editor", "billing"), true);
});

test("admin can access billing", () => {
  assert.equal(can("admin", "billing"), true);
});

test("viewer cannot access billing", () => {
  assert.equal(can("viewer", "billing"), false);
});

test("unknown role returns false updated", () => {
  assert.equal(can("unknown" as any, "read"), false);
});
