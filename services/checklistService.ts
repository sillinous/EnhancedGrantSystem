
import { ChecklistItem, GrantOpportunity } from '../types';

const CHECKLISTS_KEY = 'grantfinder_checklists';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75); // Slice to avoid overly long keys
};

const getAllChecklists = (): Record<string, ChecklistItem[]> => {
  try {
    const checklistsJson = localStorage.getItem(CHECKLISTS_KEY);
    return checklistsJson ? JSON.parse(checklistsJson) : {};
  } catch (error) {
    console.error("Failed to parse checklists from localStorage", error);
    return {};
  }
};

export const getChecklist = (grant: GrantOpportunity): ChecklistItem[] => {
  if (!grant) return [];
  const grantId = getGrantId(grant);
  const allChecklists = getAllChecklists();
  return allChecklists[grantId] || [];
};

export const saveChecklist = (grant: GrantOpportunity, items: ChecklistItem[]): void => {
  if (!grant) return;
  try {
    const grantId = getGrantId(grant);
    const allChecklists = getAllChecklists();
    allChecklists[grantId] = items;
    const checklistsJson = JSON.stringify(allChecklists);
    localStorage.setItem(CHECKLISTS_KEY, checklistsJson);
  } catch (error) {
    console.error("Failed to save checklist to localStorage", error);
  }
};