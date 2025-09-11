
import { ReportingRequirement, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getRequirements = async (grantId: string): Promise<ReportingRequirement[]> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/reporting`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch reporting requirements');
    return response.json();
};

export const addRequirement = async (grantId: string, requirementData: Omit<ReportingRequirement, 'id' | 'grantId' | 'completed'>): Promise<ReportingRequirement> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/reporting`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...requirementData, completed: false }),
    });
    if (!response.ok) throw new Error('Failed to add reporting requirement');
    return response.json();
};

export const updateRequirement = async (grantId: string, updatedRequirement: ReportingRequirement): Promise<ReportingRequirement> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/reporting/${updatedRequirement.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedRequirement),
    });
    if (!response.ok) throw new Error('Failed to update reporting requirement');
    return response.json();
};

export const deleteRequirement = async (grantId: string, requirementId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/reporting/${requirementId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete reporting requirement');
};
