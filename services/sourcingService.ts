import { SourcingAgent } from '../types';

const SOURCING_AGENTS_KEY = 'grantfinder_sourcingAgents';

const defaultAgents: SourcingAgent[] = [
  // FIX: Added missing 'profileId' property to satisfy the SourcingAgent type.
  { id: 1, profileId: 1001, name: 'Global Climate Tech Agent', sector: 'Renewable Energy, Sustainability, Conservation', status: 'Active' },
  // FIX: Added missing 'profileId' property to satisfy the SourcingAgent type.
  { id: 2, profileId: 1001, name: 'European Arts & Culture Agent', sector: 'Fine Arts, Performing Arts, Heritage Projects', status: 'Active' },
  // FIX: Added missing 'profileId' property to satisfy the SourcingAgent type.
  { id: 3, profileId: 1001, name: 'North American Small Business Agent', sector: 'Startups, Local Businesses, Innovation', status: 'Active' },
  // FIX: Added missing 'profileId' property to satisfy the SourcingAgent type.
  { id: 4, profileId: 1001, name: 'Global Health Initiatives Agent', sector: 'Medical Research, Public Health, Wellness', status: 'Active' },
];

export const getAgents = (): SourcingAgent[] => {
  try {
    const agentsJson = localStorage.getItem(SOURCING_AGENTS_KEY);
    if (agentsJson) {
      return JSON.parse(agentsJson);
    } else {
      // If no agents are in storage, initialize with defaults
      localStorage.setItem(SOURCING_AGENTS_KEY, JSON.stringify(defaultAgents));
      return defaultAgents;
    }
  } catch (error) {
    console.error("Failed to parse sourcing agents from localStorage", error);
    return defaultAgents; // Return defaults on error
  }
};