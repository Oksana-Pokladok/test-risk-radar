import { test } from "node:test";
import assert from "node:assert/strict";
import { retryCharge, DEFAULT_RETRY_CONFIG, RetryConfig, ChargeResult } from "../../src/billing/retry";

// Suppress real delays in all tests
const NO_DELAY_CONFIG: RetryConfig = {
  ...DEFAULT_RETRY_CONFIG,
  initialDelayMs: 0,
  maxDelayMs: 0,
};

function makeRetryable(reason = "timeout"): ChargeResult {
  return { success: false, reason, retryable: true };
}

function makeSuccess(transactionId = "txn"): ChargeResult {
  return { success: true, transactionId };
}

test("succeeds immediately on first attempt", async () => {
  const { finalResult, attempts } = await retryCharge(
    async () => makeSuccess("txn_001"),
    NO_DELAY_CONFIG
  );

  assert.equal(finalResult.success, true);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].attempt, 1);
});

test("retries on retryable failure and succeeds on second attempt", async () => {
  let calls = 0;
  const { finalResult, attempts } = await retryCharge(async () => {
    calls++;
    return calls === 1 ? makeRetryable("timeout") : makeSuccess("txn_002");
  }, NO_DELAY_CONFIG);

  assert.equal(finalResult.success, true);
  assert.equal(attempts.length, 2);
});

test("stops immediately on non-retryable failure", async () => {
  const { finalResult, attempts } = await retryCharge(
    async () => ({ success: false, reason: "card_declined", retryable: false }),
    NO_DELAY_CONFIG
  );

  assert.equal(finalResult.success, false);
  assert.equal(attempts.length, 1);
  if (!finalResult.success) {
    assert.equal(finalResult.reason, "card_declined");
  }
});

test("exhausts all attempts and returns failure after maxAttempts retryable errors", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  let calls = 0;
  const { finalResult, attempts } = await retryCharge(async () => {
    calls++;
    return makeRetryable("network_error");
  }, config);

  assert.equal(calls, 3);
  assert.equal(attempts.length, 3);
  assert.equal(finalResult.success, false);
  if (!finalResult.success) {
    assert.match(finalResult.reason, /3 attempts/);
  }
});

test("records correct attempt numbers in history", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  const { attempts } = await retryCharge(async () => makeRetryable(), config);

  assert.deepEqual(attempts.map((a) => a.attempt), [1, 2, 3]);
});

test("uses default config when none provided", async () => {
  const { finalResult } = await retryCharge(async () => makeSuccess("txn_default"));

  assert.equal(finalResult.success, true);
});

test("last attempt has no delayMsBeforeNext", async () => {
  const config: RetryConfig = { maxAttempts: 2, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  const { attempts } = await retryCharge(async () => makeRetryable(), config);

  assert.equal(attempts.length, 2);
  assert.equal(attempts[1].delayMsBeforeNext, undefined);
});

test("intermediate attempts have delayMsBeforeNext set", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  const { attempts } = await retryCharge(async () => makeRetryable(), config);

  assert.notEqual(attempts[0].delayMsBeforeNext, undefined);
  assert.notEqual(attempts[1].delayMsBeforeNext, undefined);
  assert.equal(attempts[2].delayMsBeforeNext, undefined);
});

test("exponential backoff: each delay doubles up to maxDelayMs", async () => {
  const config: RetryConfig = {
    maxAttempts: 4,
    initialDelayMs: 100,
    backoffMultiplier: 2,
    maxDelayMs: 300,
  };
  const { attempts } = await retryCharge(async () => makeRetryable(), config);

  // attempt 1: 100 * 2^0 = 100, attempt 2: 100 * 2^1 = 200, attempt 3: capped at 300
  assert.equal(attempts[0].delayMsBeforeNext, 100);
  assert.equal(attempts[1].delayMsBeforeNext, 200);
  assert.equal(attempts[2].delayMsBeforeNext, 300);
  assert.equal(attempts[3].delayMsBeforeNext, undefined);
});

test("each attempt result is stored in history", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  let calls = 0;
  const { attempts } = await retryCharge(async () => {
    calls++;
    return calls < 3 ? makeRetryable("err_" + calls) : makeSuccess("txn_final");
  }, config);

  assert.equal(attempts[0].result.success, false);
  assert.equal(attempts[1].result.success, false);
  assert.equal(attempts[2].result.success, true);
  if (attempts[2].result.success) {
    assert.equal(attempts[2].result.transactionId, "txn_final");
  }
});

test("maxAttempts=1 makes no retries and synthesizes failure", async () => {
  const config: RetryConfig = { maxAttempts: 1, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  let calls = 0;
  const { finalResult, attempts } = await retryCharge(async () => {
    calls++;
    return makeRetryable("timeout");
  }, config);

  assert.equal(calls, 1);
  assert.equal(attempts.length, 1);
  assert.equal(finalResult.success, false);
  if (!finalResult.success) {
    assert.match(finalResult.reason, /1 attempt/);
  }
});

test("succeeds on the last possible attempt", async () => {
  const config: RetryConfig = { maxAttempts: 3, initialDelayMs: 0, backoffMultiplier: 2, maxDelayMs: 0 };
  let calls = 0;
  const { finalResult, attempts } = await retryCharge(async () => {
    calls++;
    return calls < config.maxAttempts ? makeRetryable() : makeSuccess("txn_last");
  }, config);

  assert.equal(finalResult.success, true);
  assert.equal(attempts.length, 3);
  if (finalResult.success) {
    assert.equal(finalResult.transactionId, "txn_last");
  }
});

test("transactionId from chargeFn is preserved in finalResult", async () => {
  const { finalResult } = await retryCharge(
    async () => makeSuccess("txn_preserved"),
    NO_DELAY_CONFIG
  );

  assert.equal(finalResult.success, true);
  if (finalResult.success) {
    assert.equal(finalResult.transactionId, "txn_preserved");
  }
});

test("non-retryable failure reason is preserved in finalResult", async () => {
  const { finalResult } = await retryCharge(
    async () => ({ success: false, reason: "fraud_block", retryable: false }),
    NO_DELAY_CONFIG
  );

  assert.equal(finalResult.success, false);
  if (!finalResult.success) {
    assert.equal(finalResult.reason, "fraud_block");
    assert.equal(finalResult.retryable, false);
  }
});
