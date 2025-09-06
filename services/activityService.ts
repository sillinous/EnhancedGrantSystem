
import { ActivityLog, GrantOpportunity, User } from '../types';

const ACTIVITY_LOG_KEY = 'grantfinder_activityLog';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllLogs = (): Record<string, ActivityLog[]> => {
  try {
    const logsJson = localStorage.getItem(ACTIVITY_LOG_KEY);
    return logsJson ? JSON.parse(logsJson) : {};
  } catch (error) {
    console.error("Failed to parse activity logs from localStorage", error);
    return {};
  }
};

const saveAllLogs = (allLogs: Record<string, ActivityLog[]>): void => {
  try {
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(allLogs));
  } catch (error) {
    console.error("Failed to save activity logs to localStorage", error);
  }
};

export const getActivitiesForGrant = (grant: GrantOpportunity): ActivityLog[] => {
  if (!grant) return [];
  const grantId = getGrantId(grant);
  const allLogs = getAllLogs();
  return (allLogs[grantId] || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const logActivity = (grant: GrantOpportunity, user: User, action: string): void => {
  if (!grant || !user) return;
  const grantId = getGrantId(grant);
  const allLogs = getAllLogs();
  const grantLogs = allLogs[grantId] || [];

  const newLog: ActivityLog = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    username: user.username,
    userId: user.id,
    action,
  };

  allLogs[grantId] = [newLog, ...grantLogs];
  saveAllLogs(allLogs);
};
