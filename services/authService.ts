import { User, Role } from '../types';

const API_URL = 'http://localhost:3001/api'; // In a real app, this would be in an env variable
const TOKEN_KEY = 'grantfinder_authToken';
const IMPERSONATOR_KEY = 'grantfinder_impersonator';
const ALL_USERS_KEY = 'grantfinder_allUsers'; // Kept for SuperAdmin impersonation list

// In a real application, this would come from a database.
const defaultUsers: User[] = [
  { id: 1, username: 'user@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
  { id: 2, username: 'pro_user@example.com', role: 'User', isSubscribed: true, teamIds: [101, 102] },
  { id: 3, username: 'admin@example.com', role: 'Admin', isSubscribed: true, teamIds: [] },
  { id: 4, username: 'teammate@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
];

export const getAllUsers = (): User[] => {
    try {
        const usersJson = localStorage.getItem(ALL_USERS_KEY);
        if (usersJson) {
            return JSON.parse(usersJson);
        } else {
            localStorage.setItem(ALL_USERS_KEY, JSON.stringify(defaultUsers));
            return defaultUsers;
        }
    } catch (error) {
        console.error("Failed to parse users from localStorage", error);
        return [];
    }
};

export const login = async (username: string, password?: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { token, user } = await response.json();
    localStorage.setItem(TOKEN_KEY, token);
    return user;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IMPERSONATOR_KEY);
};

export const verifySession = async (): Promise<User | null> => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token is invalid or expired, so log out
      logout();
      return null;
    }

    const { user } = await response.json();
    return user;
  } catch (error) {
    console.error('Session verification error:', error);
    // Network error, etc.
    return null;
  }
};

// getCurrentUser is now a simple synchronous check for the token's existence,
// but the actual user data comes from the async verifySession call.
// This function is kept for legacy checks but should be used sparingly.
export const getCurrentUser = (): User | null => {
    // This function is now misleading. The source of truth is the backend.
    // We will keep it for the impersonation logic which is still client-side for now.
    // In a real app, impersonation would also be a backend-managed state.
    const token = localStorage.getItem(TOKEN_KEY);
    // A proper implementation would decode the token here to get user info without a network call.
    // For simplicity, we'll rely on verifySession to populate user state.
    // If a token exists, we assume a user might be logged in.
    return token ? { id: 0, username: '', role: 'User', isSubscribed: false, teamIds: [] } : null; 
};


export const getImpersonator = (): User | null => {
  try {
    const userJson = localStorage.getItem(IMPERSONATOR_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};


export const impersonate = (targetUserId: number): boolean => {
    const adminUser = { id: 3, username: 'admin@example.com', role: 'Admin', isSubscribed: true, teamIds: [] }; // Mocking admin for now
    if (!adminUser || adminUser.role !== 'Admin') {
        console.error("Only admins can impersonate.");
        return false;
    }
    
    // In a real app, we would request an impersonation token from the backend.
    // Here, we simulate it by finding the target user and creating a mock token/session.
    // This is NOT secure and is for demonstration only.
    const targetUser = getAllUsers().find(u => u.id === targetUserId);
     if (!targetUser) {
        console.error("Target user not found.");
        return false;
    }

    // Mocking a login for the target user. We'd get a real token from the backend.
    const mockToken = `mock-token-for-user-${targetUser.id}`;
    localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(adminUser)); // Save who is doing the impersonating
    localStorage.setItem(TOKEN_KEY, mockToken); // Set the "session" to the target user
    
    // We need to store the target user object somewhere to be retrieved by App.tsx
    // Storing it in session storage is a temporary solution for this mock.
    sessionStorage.setItem('impersonated_user', JSON.stringify(targetUser));
    
    return true;
};

export const stopImpersonation = (): boolean => {
    const adminUser = getImpersonator();
    if (!adminUser) {
        console.error("Not in impersonation mode.");
        return false;
    }
    
    sessionStorage.removeItem('impersonated_user');
    // We would ask the backend for a new token for the admin user.
    // For now, we'll just mock it.
    const mockToken = `mock-token-for-user-${adminUser.id}`;
    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.removeItem(IMPERSONATOR_KEY);
    return true;
};


export const updateSubscriptionStatus = (userId: number, isSubscribed: boolean): User | null => {
    // This logic will move to the backend. For now, we update the mock user list.
    const allUsers = getAllUsers();
    const userIndex = allUsers.findIndex(u => u.id === userId);
    
    if (userIndex > -1) {
        allUsers[userIndex].isSubscribed = isSubscribed;
    }
    return null;
};
