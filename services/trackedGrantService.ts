import { GrantOpportunity } from '../types';

const TRACKED_GRANTS_KEY = 'grantfinder_tracked_grants';

export const getTrackedGrants = (): GrantOpportunity[] => {
    try {
        const grantsJson = localStorage.getItem(TRACKED_GRANTS_KEY);
        return grantsJson ? JSON.parse(grantsJson) : [];
    } catch (error) {
        console.error("Failed to parse tracked grants from localStorage", error);
        return [];
    }
};

const saveTrackedGrants = (grants: GrantOpportunity[]): void => {
    try {
        localStorage.setItem(TRACKED_GRANTS_KEY, JSON.stringify(grants));
    } catch (error) {
        console.error("Failed to save tracked grants to localStorage", error);
    }
};

export const addTrackedGrant = (grantToAdd: GrantOpportunity): void => {
    const trackedGrants = getTrackedGrants();
    const grantExists = trackedGrants.some(g => g.url === grantToAdd.url && g.name === grantToAdd.name);
    if (!grantExists) {
        saveTrackedGrants([...trackedGrants, grantToAdd]);
    }
};