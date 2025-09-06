
import { User } from '../types';

const USAGE_KEY = 'grantfinder_featureUsage';
const USAGE_LIMIT = 5; // 5 free uses per feature per month

interface FeatureUsage {
  count: number;
  resetDate: number; // Timestamp for next reset
}

type UserUsage = Record<string, FeatureUsage>; // featureName -> FeatureUsage
type AllUsage = Record<string, UserUsage>; // userId -> UserUsage

const getUsageData = (): AllUsage => {
  try {
    const data = localStorage.getItem(USAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
};

const saveUsageData = (data: AllUsage): void => {
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
};

// Check and reset usage if a new month has started
const checkAndResetUsage = (usage: FeatureUsage): FeatureUsage => {
  const now = Date.now();
  if (now > usage.resetDate) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      count: 0,
      resetDate: nextMonth.getTime(),
    };
  }
  return usage;
};

export const getUsage = (userId: number, featureName: string): { count: number, limit: number, remaining: number } => {
  const allUsage = getUsageData();
  let userUsage = allUsage[String(userId)] || {};
  
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  let featureUsage = userUsage[featureName] || {
    count: 0,
    resetDate: nextMonth.getTime(),
  };

  featureUsage = checkAndResetUsage(featureUsage);
  userUsage[featureName] = featureUsage;
  allUsage[String(userId)] = userUsage;
  saveUsageData(allUsage);

  return {
    count: featureUsage.count,
    limit: USAGE_LIMIT,
    remaining: Math.max(0, USAGE_LIMIT - featureUsage.count),
  };
};

export const recordUsage = (userId: number, featureName: string): void => {
  const allUsage = getUsageData();
  let userUsage = allUsage[String(userId)] || {};

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  let featureUsage = userUsage[featureName] || {
    count: 0,
    resetDate: nextMonth.getTime(),
  };

  featureUsage = checkAndResetUsage(featureUsage);
  featureUsage.count += 1;

  userUsage[featureName] = featureUsage;
  allUsage[String(userId)] = userUsage;
  saveUsageData(allUsage);
};
