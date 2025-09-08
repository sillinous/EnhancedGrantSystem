import { FunderPersona, GrantOpportunity } from '../types';

const PERSONAS_KEY = 'grantfinder_personas';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};


const getAllPersonas = (): Record<string, FunderPersona> => {
  try {
    const personasJson = localStorage.getItem(PERSONAS_KEY);
    return personasJson ? JSON.parse(personasJson) : {};
  } catch (error) {
    console.error("Failed to parse funder personas from localStorage", error);
    return {};
  }
};

const saveAllPersonas = (allPersonas: Record<string, FunderPersona>): void => {
  try {
    localStorage.setItem(PERSONAS_KEY, JSON.stringify(allPersonas));
  } catch (error) {
    console.error("Failed to save funder personas to localStorage", error);
  }
};

export const getPersona = (grant: GrantOpportunity): FunderPersona | null => {
  if (!grant) return null;
  const grantId = getGrantId(grant);
  const allPersonas = getAllPersonas();
  return allPersonas[grantId] || null;
};

export const savePersona = (grant: GrantOpportunity, persona: FunderPersona): void => {
  if (!grant) return;
  const grantId = getGrantId(grant);
  const allPersonas = getAllPersonas();
  allPersonas[grantId] = persona;
  saveAllPersonas(allPersonas);
};