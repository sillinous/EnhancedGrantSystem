
import { SourcingAgent } from '../types';

const SOURCING_AGENTS_KEY = 'grantfinder_sourcingAgents';

const defaultAgents: SourcingAgent[] = [
  { id: 'agent_1', name: 'Global Climate Tech Agent', sector: 'Renewable Energy, Sustainability, Conservation', status: 'Active' },
  { id: 'agent_2', name: 'European Arts & Culture Agent', sector: 'Fine Arts, Performing Arts, Heritage Projects', status: 'Active' },
  { id: 'agent_3', name: 'North American Small Business Agent', sector: 'Startups, Local Businesses, Innovation', status: 'Active' },
  { id: 'agent_4', name: 'Global Health Initiatives Agent', sector: 'Medical Research, Public Health, Wellness', status: 'Active' },
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
