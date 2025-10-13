
import { ActivityLog, GrantOpportunity, User } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getActivitiesForGrant = async (grantId: string): Promise<ActivityLog[]> => {
    const response = await fetch(`${API_URL}/grants/${grantId}/activity`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch activities');
    return response.json();
};

export const logActivity = async (grantId: string, user: User, action: string): Promise<ActivityLog> => {
    const logData = {
        username: user.username,
        userId: user.id,
        action,
    };
    const response = await fetch(`${API_URL}/grants/${grantId}/activity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(logData),
    });
    if (!response.ok) throw new Error('Failed to log activity');
    return response.json();
};
