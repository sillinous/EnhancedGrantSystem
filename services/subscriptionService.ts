import { Subscription, User } from '../types';
import * as authService from './authService';

const SUBSCRIPTIONS_KEY = 'grantfinder_subscriptions';

// FIX: Export `getAllSubscriptions` to make it accessible to other modules.
export const getAllSubscriptions = (): Record<string, Subscription> => {
  try {
    const subsJson = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return subsJson ? JSON.parse(subsJson) : {};
  } catch (error) {
    console.error("Failed to parse subscriptions from localStorage", error);
    return {};
  }
};

const saveAllSubscriptions = (allSubs: Record<string, Subscription>): void => {
  localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(allSubs));
};

export const getSubscription = (userId: number): Subscription => {
  const allSubs = getAllSubscriptions();
  const existingSub = allSubs[String(userId)];

  // Create a default free subscription if one doesn't exist
  if (!existingSub) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const freeSub: Subscription = {
      userId,
      plan: 'Free',
      status: 'active',
      currentPeriodEnd: nextMonth.getTime(),
    };
    allSubs[String(userId)] = freeSub;
    saveAllSubscriptions(allSubs);
    return freeSub;
  }
  
  return existingSub;
};

export const createProSubscription = (user: User): { user: User, subscription: Subscription } | null => {
  const allSubs = getAllSubscriptions();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const newSub: Subscription = {
    userId: user.id,
    plan: 'Pro',
    status: 'active',
    currentPeriodEnd: nextMonth.getTime(),
  };

  allSubs[String(user.id)] = newSub;
  saveAllSubscriptions(allSubs);

  const updatedUser = authService.updateSubscriptionStatus(user.id, true);
  
  if (updatedUser) {
    return { user: updatedUser, subscription: newSub };
  }
  
  return null;
};

export const cancelSubscription = (userId: number): Subscription | null => {
  const allSubs = getAllSubscriptions();
  const sub = allSubs[String(userId)];

  if (sub && sub.plan === 'Pro') {
    sub.status = 'canceled';
    saveAllSubscriptions(allSubs);
    authService.updateSubscriptionStatus(userId, false);
    return sub;
  }
  return null;
};
