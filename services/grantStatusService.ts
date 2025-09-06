import { GrantStatus } from '../types';

const STATUSES_KEY = 'grantfinder_statuses';

export const getAllGrantStatuses = (): Record<string, GrantStatus> => {
  try {
    const statusesJson = localStorage.getItem(STATUSES_KEY);
    return statusesJson ? JSON.parse(statusesJson) : {};
  } catch (error) {
    console.error("Failed to parse grant statuses from localStorage", error);
    return {};
  }
};

export const saveGrantStatus = (grantId: string, status: GrantStatus): void => {
  try {
    const allStatuses = getAllGrantStatuses();
    allStatuses[grantId] = status;
    const statusesJson = JSON.stringify(allStatuses);
    localStorage.setItem(STATUSES_KEY, statusesJson);
  } catch (error) {
    console.error("Failed to save grant status to localStorage", error);
  }
};
