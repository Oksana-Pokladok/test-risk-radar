export interface LDUser {
  key: string;
  email?: string;
  plan?: string;
}

// In production this would wrap the LaunchDarkly Node SDK client.
// For now we use a simple in-memory stub that reads from environment overrides.
const FLAG_OVERRIDES: Record<string, boolean> = {};

if (process.env.LD_FLAG_OVERRIDES) {
  try {
    Object.assign(FLAG_OVERRIDES, JSON.parse(process.env.LD_FLAG_OVERRIDES));
  } catch {
    // ignore malformed overrides
  }
}

export function getFlag(flagKey: string, user: LDUser, defaultValue: boolean): boolean {
  if (flagKey in FLAG_OVERRIDES) {
    return FLAG_OVERRIDES[flagKey];
  }
  return defaultValue;
}

// Feature flags
export const Flags = {
  ANNUAL_BILLING: 'annual-billing',
  USAGE_BASED_PRICING: 'usage-based-pricing',
  SELF_SERVE_ENTERPRISE: 'self-serve-enterprise',
  BILLING_RETRY: 'billing-retry',
} as const;
