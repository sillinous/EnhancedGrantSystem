import { SuccessPatternAnalysis, GrantOpportunity } from '../types';

const SUCCESS_PATTERNS_KEY = 'grantfinder_successPatterns';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};


const getAllSuccessPatternAnalyses = (): Record<string, SuccessPatternAnalysis> => {
  try {
    const analysesJson = localStorage.getItem(SUCCESS_PATTERNS_KEY);
    return analysesJson ? JSON.parse(analysesJson) : {};
  } catch (error) {
    console.error("Failed to parse success pattern analyses from localStorage", error);
    return {};
  }
};

const saveAllSuccessPatternAnalyses = (allAnalyses: Record<string, SuccessPatternAnalysis>): void => {
  try {
    localStorage.setItem(SUCCESS_PATTERNS_KEY, JSON.stringify(allAnalyses));
  } catch (error) {
    console.error("Failed to save success pattern analyses to localStorage", error);
  }
};

export const getSuccessPatternAnalysis = (grant: GrantOpportunity): SuccessPatternAnalysis | null => {
  if (!grant) return null;
  const grantId = getGrantId(grant);
  const allAnalyses = getAllSuccessPatternAnalyses();
  return allAnalyses[grantId] || null;
};

export const saveSuccessPatternAnalysis = (grant: GrantOpportunity, analysis: SuccessPatternAnalysis): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allAnalyses = getAllSuccessPatternAnalyses();
  allAnalyses[grantId] = analysis;
  saveAllSuccessPatternAnalyses(allAnalyses);
};