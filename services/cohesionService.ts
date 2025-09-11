
import { CohesionAnalysis, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getCohesionAnalysis = async (grantId: string): Promise<CohesionAnalysis | null> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/cohesion`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch cohesion analysis');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const saveCohesionAnalysis = async (grantId: string, analysis: Omit<CohesionAnalysis, 'generatedAt'>): Promise<CohesionAnalysis> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/cohesion`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(analysis),
    });
    if (!response.ok) throw new Error('Failed to save cohesion analysis');
    return response.json();
};
