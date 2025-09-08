import { GrantDraft, GrantOpportunity, Comment } from '../types';

const DRAFTS_KEY = 'grantfinder_drafts';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllDrafts = (): Record<string, GrantDraft[]> => {
  try {
    const draftsJson = localStorage.getItem(DRAFTS_KEY);
    return draftsJson ? JSON.parse(draftsJson) : {};
  } catch (error) {
    console.error("Failed to parse drafts from localStorage", error);
    return {};
  }
};

const saveAllDrafts = (allDrafts: Record<string, GrantDraft[]>): void => {
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(allDrafts));
  } catch (error) {
    console.error("Failed to save drafts to localStorage", error);
  }
};

export const getDrafts = (grant: GrantOpportunity): GrantDraft[] => {
  if (!grant) return [];
  const grantId = getGrantId(grant);
  const allDrafts = getAllDrafts();
  return allDrafts[grantId] || [];
};

export const addDraft = (grant: GrantOpportunity, draftData: { section: string; content: string }): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allDrafts = getAllDrafts();
  const grantDrafts = allDrafts[grantId] || [];

  const newDraft: GrantDraft = {
    id: Date.now(),
    grantId,
    ...draftData,
    createdAt: new Date().toISOString(),
    status: 'Draft',
    // FIX: Add missing `comments` property to satisfy the GrantDraft type.
    comments: [],
  };

  allDrafts[grantId] = [...grantDrafts, newDraft];
  saveAllDrafts(allDrafts);
};

export const updateDraft = (grant: GrantOpportunity, updatedDraft: GrantDraft): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allDrafts = getAllDrafts();
  let grantDrafts = allDrafts[grantId] || [];
  grantDrafts = grantDrafts.map(d => d.id === updatedDraft.id ? updatedDraft : d);
  allDrafts[grantId] = grantDrafts;
  saveAllDrafts(allDrafts);
};

export const deleteDraft = (grant: GrantOpportunity, draftId: number): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allDrafts = getAllDrafts();
  let grantDrafts = allDrafts[grantId] || [];
  allDrafts[grantId] = grantDrafts.filter(d => d.id !== draftId);
  saveAllDrafts(allDrafts);
};