import { GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getTrackedGrants = async (): Promise<GrantOpportunity[]> => {
    const response = await fetch(`${API_URL}/grants`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch tracked grants');
    }
    return response.json();
};

export const addTrackedGrant = async (grantToAdd: GrantOpportunity): Promise<GrantOpportunity> => {
    const response = await fetch(`${API_URL}/grants`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(grantToAdd)
    });
    if (!response.ok) {
        throw new Error('Failed to add tracked grant');
    }
    return response.json();
};
