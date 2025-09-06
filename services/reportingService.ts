import { ReportingRequirement, GrantOpportunity } from '../types';

const REPORTING_KEY = 'grantfinder_reporting';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllRequirements = (): Record<string, ReportingRequirement[]> => {
  try {
    const requirementsJson = localStorage.getItem(REPORTING_KEY);
    return requirementsJson ? JSON.parse(requirementsJson) : {};
  } catch (error) {
    console.error("Failed to parse reporting requirements from localStorage", error);
    return {};
  }
};

const saveAllRequirements = (allRequirements: Record<string, ReportingRequirement[]>): void => {
  try {
    localStorage.setItem(REPORTING_KEY, JSON.stringify(allRequirements));
  } catch (error) {
    console.error("Failed to save reporting requirements to localStorage", error);
  }
};

export const getRequirements = (grant: GrantOpportunity): ReportingRequirement[] => {
  if (!grant) return [];
  const grantId = getGrantId(grant);
  const allRequirements = getAllRequirements();
  return allRequirements[grantId] || [];
};

export const addRequirement = (grant: GrantOpportunity, requirementData: Omit<ReportingRequirement, 'id' | 'grantId' | 'completed'>): ReportingRequirement => {
  const grantId = getGrantId(grant);
  const allRequirements = getAllRequirements();
  const grantRequirements = allRequirements[grantId] || [];
  const newRequirement: ReportingRequirement = {
    ...requirementData,
    id: Date.now(),
    grantId,
    completed: false,
  };
  allRequirements[grantId] = [...grantRequirements, newRequirement];
  saveAllRequirements(allRequirements);
  return newRequirement;
};

export const updateRequirement = (grant: GrantOpportunity, updatedRequirement: ReportingRequirement): void => {
  const grantId = getGrantId(grant);
  const allRequirements = getAllRequirements();
  let grantRequirements = allRequirements[grantId] || [];
  grantRequirements = grantRequirements.map(r => r.id === updatedRequirement.id ? updatedRequirement : r);
  allRequirements[grantId] = grantRequirements;
  saveAllRequirements(allRequirements);
};

export const deleteRequirement = (grant: GrantOpportunity, requirementId: number): void => {
  const grantId = getGrantId(grant);
  const allRequirements = getAllRequirements();
  let grantRequirements = allRequirements[grantId] || [];
  allRequirements[grantId] = grantRequirements.filter(r => r.id !== requirementId);
  saveAllRequirements(allRequirements);
};