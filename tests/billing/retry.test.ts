import { test } from "node:test";
import assert from "node:assert/strict";
import { retryCharge, DEFAULT_RETRY_CONFIG, RetryConfig, ChargeResult } from "../../src/billing/retry";

// Suppress real delays in all tests
const NO_DELAY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  initialDelayMs: 0,
  maxDelayMs: 0,
};

test("succeeds immediately on first attempt", async () => {
  const chargeFn = async (): Promise<ChargeResult> => ({
    success: true,
    transactionId: "txn_001",
  });

  const { finalResult, attempts } = await retryCharge(chargeFn, NO_DELAY_CONFIG);

  assert.equal(finalResult.success, true);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].attempt, 1);
});

test("retries on retryable failure and succeeds on second attempt", async () => {
  let calls = 0;
  const chargeFn = async (): Promise<ChargeResult> => {
    calls++;
    if (calls === 1) return { success: false, reason: "timeout", retryable: true };
    return { success: true, transactionId: "txn_002" };
  };

  const { finalResult, attempts } = await retryCharge(chargeFn, NO_DELAY_CONFIG);

  assert.equal(finalResult.success, true);
  assert.equal(attempts.length, 2);
});

test("stops immediately on non-retryable failure", async () => {
  const chargeFn = async (): Promise<ChargeResult> => ({
    success: false,
    reason: "card_declined",
    retryable: false,
  });

  const { finalResult, attempts } = await retryCharge(chargeFn, NO_DELAY_CONFIG);

  assert.equal(finalResult.success, false);
  assert.equal(attempts.length, 1);
  if (!finalResult.success) {
    assert.equal(finalResult.reason, "card_declined");
  }
});

test("exhausts all attempts and returns failure after maxAttempts retryable errors", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  let calls = 0;
  const chargeFn = async (): Promise<ChargeResult> => {
    calls++;
    return { success: false, reason: "network_error", retryable: true };
  };

  const { finalResult, attempts } = await retryCharge(chargeFn, config);

  assert.equal(calls, 3);
  assert.equal(attempts.length, 3);
  assert.equal(finalResult.success, false);
  if (!finalResult.success) {
    assert.match(finalResult.reason, /3 attempts/);
  }
});

test("records correct attempt numbers in history", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  const chargeFn = async (): Promise<ChargeResult> => ({
    success: false,
    reason: "timeout",
    retryable: true,
  });

  const { attempts } = await retryCharge(chargeFn, config);

  assert.deepEqual(
    attempts.map((a) => a.attempt),
    [1, 2, 3]
  );
});

test("uses default config when none provided", async () => {
  const chargeFn = async (): Promise<ChargeResult> => ({
    success: true,
    transactionId: "txn_default",
  });

  const { finalResult } = await retryCharge(chargeFn);

  assert.equal(finalResult.success, true);
});

test("last attempt has no delayMsBeforeNext", async () => {
  const config: RetryConfig = { maxAttempts: 2, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  const chargeFn = async (): Promise<ChargeResult> => ({
    success: false,
    reason: "timeout",
    retryable: true,
  });

  const { attempts } = await retryCharge(chargeFn, config);

  assert.equal(attempts.length, 2);
  assert.equal(attempts[1].delayMsBeforeNext, undefined);
});
