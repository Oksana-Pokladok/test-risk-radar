export type Plan = 'free' | 'pro' | 'enterprise';

export interface Subscription {
  userId: string;
  plan: Plan;
  startedAt: Date;
  renewsAt: Date;
  cancelledAt?: Date;
}

export function createSubscription(userId: string, plan: Plan): Subscription {
  const now = new Date();
  return {
    userId,
    plan,
    startedAt: now,
    renewsAt: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
  };
}

export function cancelSubscription(subscription: Subscription): Subscription {
  return { ...subscription, cancelledAt: new Date() };
}

export function isActive(subscription: Subscription): boolean {
  return !subscription.cancelledAt && new Date() < subscription.renewsAt;
}

export function upgradePlan(subscription: Subscription, newPlan: Plan): Subscription {
  return { ...subscription, plan: newPlan };
}
