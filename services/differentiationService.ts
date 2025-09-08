import { DifferentiationAnalysis, GrantOpportunity } from '../types';

const DIFFERENTIATION_ANALYSES_KEY = 'grantfinder_differentiationAnalyses';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllAnalyses = (): Record<string, DifferentiationAnalysis> => {
  try {
    const analysesJson = localStorage.getItem(DIFFERENTIATION_ANALYSES_KEY);
    return analysesJson ? JSON.parse(analysesJson) : {};
  } catch (error) {
    console.error("Failed to parse differentiation analyses from localStorage", error);
    return {};
  }
};

const saveAllAnalyses = (allAnalyses: Record<string, DifferentiationAnalysis>): void => {
  try {
    localStorage.setItem(DIFFERENTIATION_ANALYSES_KEY, JSON.stringify(allAnalyses));
  } catch (error) {
    console.error("Failed to save differentiation analyses to localStorage", error);
  }
};

export const getDifferentiationAnalysis = (grant: GrantOpportunity): DifferentiationAnalysis | null => {
  if (!grant) return null;
  const grantId = getGrantId(grant);
  const allAnalyses = getAllAnalyses();
  return allAnalyses[grantId] || null;
};

export const saveDifferentiationAnalysis = (grant: GrantOpportunity, analysis: DifferentiationAnalysis): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allAnalyses = getAllAnalyses();
  allAnalyses[grantId] = analysis;
  saveAllAnalyses(allAnalyses);
};