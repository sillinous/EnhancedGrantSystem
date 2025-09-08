import { CohesionAnalysis, GrantOpportunity } from '../types';

const COHESION_ANALYSES_KEY = 'grantfinder_cohesionAnalyses';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllAnalyses = (): Record<string, CohesionAnalysis> => {
  try {
    const analysesJson = localStorage.getItem(COHESION_ANALYSES_KEY);
    return analysesJson ? JSON.parse(analysesJson) : {};
  } catch (error) {
    console.error("Failed to parse cohesion analyses from localStorage", error);
    return {};
  }
};

const saveAllAnalyses = (allAnalyses: Record<string, CohesionAnalysis>): void => {
  try {
    localStorage.setItem(COHESION_ANALYSES_KEY, JSON.stringify(allAnalyses));
  } catch (error) {
    console.error("Failed to save cohesion analyses to localStorage", error);
  }
};

export const getCohesionAnalysis = (grant: GrantOpportunity): CohesionAnalysis | null => {
  if (!grant) return null;
  const grantId = getGrantId(grant);
  const allAnalyses = getAllAnalyses();
  return allAnalyses[grantId] || null;
};

export const saveCohesionAnalysis = (grant: GrantOpportunity, analysis: CohesionAnalysis): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allAnalyses = getAllAnalyses();
  allAnalyses[grantId] = analysis;
  saveAllAnalyses(allAnalyses);
};