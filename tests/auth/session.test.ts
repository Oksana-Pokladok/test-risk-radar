import { test } from "node:test";
import assert from "node:assert/strict";
import { createSession, isExpired, refreshSession } from "../../src/auth/session";

test("createSession sets userId and token", () => {
  const s = createSession("user-1");
  assert.equal(s.userId, "user-1");
  assert.ok(s.token.length > 0);
});

test("createSession sets expiresAt ~1 hour in the future", () => {
  const before = Date.now();
  const s = createSession("user-1");
  const after = Date.now();
  const expires = s.expiresAt.getTime();
  assert.ok(expires >= before + 3600 * 1000 - 10);
  assert.ok(expires <= after + 3600 * 1000 + 10);
});

test("isExpired returns false for a fresh session", () => {
  const s = createSession("user-1");
  assert.equal(isExpired(s), false);
});

test("isExpired returns true for an already-expired session", () => {
  const s = createSession("user-1");
  s.expiresAt = new Date(Date.now() - 1000);
  assert.equal(isExpired(s), true);
});

test("refreshSession preserves userId", () => {
  const s = createSession("user-2");
  const refreshed = refreshSession(s);
  assert.equal(refreshed.userId, "user-2");
});

test("refreshSession generates a new token", () => {
  const s = createSession("user-1");
  const refreshed = refreshSession(s);
  assert.notEqual(refreshed.token, s.token);
});

test("refreshSession extends expiry by default 1 hour", () => {
  const s = createSession("user-1");
  const before = Date.now();
  const refreshed = refreshSession(s);
  const after = Date.now();
  const expires = refreshed.expiresAt.getTime();
  assert.ok(expires >= before + 3600 * 1000 - 10);
  assert.ok(expires <= after + 3600 * 1000 + 10);
});

test("refreshSession accepts custom TTL", () => {
  const s = createSession("user-1");
  const before = Date.now();
  const refreshed = refreshSession(s, 7200);
  const after = Date.now();
  const expires = refreshed.expiresAt.getTime();
  assert.ok(expires >= before + 7200 * 1000 - 10);
  assert.ok(expires <= after + 7200 * 1000 + 10);
});

test("refreshSession on expired session makes it valid", () => {
  const s = createSession("user-1");
  s.expiresAt = new Date(Date.now() - 1000);
  assert.equal(isExpired(s), true);
  const refreshed = refreshSession(s);
  assert.equal(isExpired(refreshed), false);
});
