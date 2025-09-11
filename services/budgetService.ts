
import { BudgetItem, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getBudgetItems = async (grantId: string): Promise<BudgetItem[]> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/budget`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch budget items');
    return response.json();
};

export const addBudgetItem = async (grantId: string, itemData: { description: string; amount: number }): Promise<BudgetItem> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/budget`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(itemData),
    });
    if (!response.ok) throw new Error('Failed to add budget item');
    return response.json();
};

export const updateBudgetItem = async (grantId: string, updatedItem: BudgetItem): Promise<BudgetItem> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/budget/${updatedItem.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedItem),
    });
    if (!response.ok) throw new Error('Failed to update budget item');
    return response.json();
};


export const deleteBudgetItem = async (grantId: string, itemId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/budget/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete budget item');
};
