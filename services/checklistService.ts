
import { ChecklistItem, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getChecklist = async (grantId: string): Promise<ChecklistItem[]> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/checklist`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch checklist');
    return response.json();
};

export const addChecklistItem = async (grantId: string, itemData: { text: string; dueDate?: string }): Promise<ChecklistItem> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/checklist`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error('Failed to add checklist item');
    return response.json();
};

export const updateChecklistItem = async (grantId: string, item: ChecklistItem): Promise<ChecklistItem> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/checklist/${item.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
    });
    if (!response.ok) throw new Error('Failed to update checklist item');
    return response.json();
};

export const deleteChecklistItem = async (grantId: string, itemId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/checklist/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete checklist item');
};
