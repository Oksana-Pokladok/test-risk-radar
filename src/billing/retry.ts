export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30_000,
};

export type ChargeResult =
  | { success: true; transactionId: string }
  | { success: false; reason: string; retryable: boolean };

export interface RetryAttempt {
  attempt: number;
  result: ChargeResult;
  delayMsBeforeNext?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextDelay(config: RetryConfig, attempt: number): number {
  const d = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(d, config.maxDelayMs);
}

export async function retryCharge(
  chargeFn: () => Promise<ChargeResult>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<{ finalResult: ChargeResult; attempts: RetryAttempt[] }> {
  const attempts: RetryAttempt[] = [];

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    const result = await chargeFn();
    const delayMs = attempt < config.maxAttempts ? nextDelay(config, attempt) : undefined;

    attempts.push({ attempt, result, delayMsBeforeNext: delayMs });

    if (result.success) {
      return { finalResult: result, attempts };
    }

    if (!result.retryable) {
      return { finalResult: result, attempts };
    }

    if (attempt < config.maxAttempts && delayMs !== undefined) {
      await delay(delayMs);
    }
  }

  const finalResult: ChargeResult = {
    success: false,
    reason: `Failed after ${config.maxAttempts} attempts`,
    retryable: false,
  };

  return { finalResult, attempts };
}
