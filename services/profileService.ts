import { FundingProfile } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getProfiles = async (): Promise<FundingProfile[]> => {
    const response = await fetch(`${API_URL}/profiles`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to fetch profiles');
    }
    return response.json();
};

export const addProfile = async (profileData: Omit<FundingProfile, 'id' | 'owner'>): Promise<FundingProfile> => {
    const response = await fetch(`${API_URL}/profiles`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
    });
    if (!response.ok) {
        throw new Error('Failed to create profile');
    }
    return response.json();
};

export const updateProfile = async (profile: FundingProfile): Promise<FundingProfile> => {
    const response = await fetch(`${API_URL}/profiles/${profile.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profile)
    });
    if (!response.ok) {
        throw new Error('Failed to update profile');
    }
    return response.json();
};

export const deleteProfile = async (profileId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/profiles/${profileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        throw new Error('Failed to delete profile');
    }
};
