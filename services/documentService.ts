
import { Document } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getDocuments = async (profileId: number): Promise<Document[]> => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/documents`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
};

export const addDocument = async (profileId: number, docData: { name: string; category: string }): Promise<Document> => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(docData),
    });
    if (!response.ok) throw new Error('Failed to add document');
    return response.json();
};

export const updateDocument = async (profileId: number, updatedDoc: Document): Promise<Document> => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/documents/${updatedDoc.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedDoc),
    });
    if (!response.ok) throw new Error('Failed to update document');
    return response.json();
};

export const deleteDocument = async (profileId: number, documentId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/profiles/${profileId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete document');
};
