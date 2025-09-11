
import { GrantDraft, GrantOpportunity, Comment } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getDrafts = async (grantId: string): Promise<GrantDraft[]> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/drafts`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch drafts');
    return response.json();
};

export const addDraft = async (grantId: string, draftData: { section: string; content: string }): Promise<GrantDraft> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/drafts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(draftData),
    });
    if (!response.ok) throw new Error('Failed to add draft');
    return response.json();
};

export const updateDraft = async (grantId: string, updatedDraft: GrantDraft): Promise<GrantDraft> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/drafts/${updatedDraft.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedDraft),
    });
    if (!response.ok) throw new Error('Failed to update draft');
    return response.json();
};

export const deleteDraft = async (grantId: string, draftId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/drafts/${draftId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete draft');
};
