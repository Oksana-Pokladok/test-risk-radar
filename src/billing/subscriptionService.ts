import { createSubscription, upgradePlan, type Plan, type Subscription } from './subscription';
import { getFlag, Flags, type LDUser } from '../flags/launchDarkly';

export function getAvailablePlans(user: LDUser): Plan[] {
  const plans: Plan[] = ['free', 'pro'];

  if (getFlag(Flags.SELF_SERVE_ENTERPRISE, user, false)) {
    plans.push('enterprise');
  }

  return plans;
}

export function subscribe(userId: string, plan: Plan, user: LDUser): Subscription {
  const availablePlans = getAvailablePlans(user);
  if (!availablePlans.includes(plan)) {
    throw new Error(`Plan "${plan}" is not available for this user`);
  }
  return createSubscription(userId, plan);
}

export function upgrade(subscription: Subscription, newPlan: Plan, user: LDUser): Subscription {
  if (getFlag(Flags.USAGE_BASED_PRICING, user, false) && newPlan === 'enterprise') {
    console.log('Usage-based pricing applied for enterprise upgrade');
  }
  return upgradePlan(subscription, newPlan);
}
