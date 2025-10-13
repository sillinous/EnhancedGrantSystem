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

export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

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
  sessionStorage.removeItem('impersonated_user');
};

export const verifySession = async (): Promise<User | null> => {
  const token = getToken();
  if (!token) {
    return null;
  }
  
  // This is special handling for the client-side impersonation demo.
  // In a real system, the token itself would be an impersonation token.
  const impersonatedUserJson = sessionStorage.getItem('impersonated_user');
   if (impersonatedUserJson && token.startsWith('mock-token-for-user-')) {
       return JSON.parse(impersonatedUserJson);
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
    
    const targetUser = getAllUsers().find(u => u.id === targetUserId);
     if (!targetUser) {
        console.error("Target user not found.");
        return false;
    }

    const mockToken = `mock-token-for-user-${targetUser.id}`;
    localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(adminUser));
    localStorage.setItem(TOKEN_KEY, mockToken);
    
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
    logout(); // Log out of the impersonated user
    
    // Now, log the admin back in. In a real app, you'd have the admin's original token.
    // Here, we just have to assume they will log in again. This is a limitation of the mock.
    // To make it smoother, we'll create a new mock token for the admin.
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