
import { SuccessPatternAnalysis, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getSuccessPatternAnalysis = async (grantId: string): Promise<SuccessPatternAnalysis | null> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/success-patterns`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch success pattern analysis');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const saveSuccessPatternAnalysis = async (grantId: string, analysis: Omit<SuccessPatternAnalysis, 'generatedAt'>): Promise<SuccessPatternAnalysis> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/success-patterns`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(analysis),
    });
    if (!response.ok) throw new Error('Failed to save success pattern analysis');
    return response.json();
};
