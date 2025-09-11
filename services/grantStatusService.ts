import { GrantStatus } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getAllGrantStatuses = async (): Promise<Record<string, GrantStatus>> => {
    const response = await fetch(`${API_URL}/grants/statuses`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch grant statuses');
    }
    return response.json();
};

export const saveGrantStatus = async (grantId: string, status: GrantStatus): Promise<void> => {
    const response = await fetch(`${API_URL}/grants/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ grantId, status })
    });
    if (!response.ok) {
        throw new Error('Failed to save grant status');
    }
};
