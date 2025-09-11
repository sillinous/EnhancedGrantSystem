
import { ApplicationReview, GrantOpportunity, RedTeamReview } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// --- Constructive Application Review ---

export const getReview = async (grantId: string): Promise<ApplicationReview | null> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/reviews`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch review');
    // An empty response body for 200 is valid if no review exists, which JSON.parse will fail on
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const saveReview = async (grantId: string, review: Omit<ApplicationReview, 'generatedAt'>): Promise<ApplicationReview> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(review),
    });
    if (!response.ok) throw new Error('Failed to save review');
    return response.json();
};


// --- Red Team Review ---

export const getRedTeamReview = async (grantId: string): Promise<RedTeamReview | null> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/red-team-reviews`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch red team review');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const saveRedTeamReview = async (grantId: string, review: Omit<RedTeamReview, 'generatedAt'>): Promise<RedTeamReview> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/red-team-reviews`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(review),
    });
    if (!response.ok) throw new Error('Failed to save red team review');
    return response.json();
};
