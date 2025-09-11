
import { Expense, GrantOpportunity } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getExpenses = async (grantId: string): Promise<Expense[]> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/expenses`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return response.json();
};

export const addExpense = async (grantId: string, expenseData: Omit<Expense, 'id' | 'grantId'>): Promise<Expense> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData),
    });
    if (!response.ok) throw new Error('Failed to add expense');
    return response.json();
};

export const deleteExpense = async (grantId: string, expenseId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete expense');
};
