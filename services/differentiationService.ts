
import { DifferentiationAnalysis, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getDifferentiationAnalysis = async (grantId: string): Promise<DifferentiationAnalysis | null> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/differentiation`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch differentiation analysis');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const saveDifferentiationAnalysis = async (grantId: string, analysis: Omit<DifferentiationAnalysis, 'generatedAt'>): Promise<DifferentiationAnalysis> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/differentiation`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(analysis),
    });
    if (!response.ok) throw new Error('Failed to save differentiation analysis');
    return response.json();
};
