
import { FunderPersona, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getPersona = async (grantId: string): Promise<FunderPersona | null> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/persona`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch persona');
    const text = await response.text();
    return text ? JSON.parse(text) : null;
};

export const savePersona = async (grantId: string, persona: Omit<FunderPersona, 'generatedAt'>): Promise<FunderPersona> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/persona`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(persona),
    });
    if (!response.ok) throw new Error('Failed to save persona');
    return response.json();
};
