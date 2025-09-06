import { User, Role } from '../types';

const CURRENT_USER_KEY = 'grantfinder_currentUser';
const ALL_USERS_KEY = 'grantfinder_allUsers';

// In a real application, this would come from a database.
const defaultUsers: User[] = [
  { id: 1, username: 'user@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
  { id: 2, username: 'pro_user@example.com', role: 'User', isSubscribed: true, teamIds: [101, 102] },
  { id: 3, username: 'admin@example.com', role: 'Admin', isSubscribed: true, teamIds: [] },
  { id: 4, username: 'teammate@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
];

const getAllUsers = (): User[] => {
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

const saveAllUsers = (users: User[]) => {
    localStorage.setItem(ALL_USERS_KEY, JSON.stringify(users));
};

export const login = (username: string, password?: string): User | null => {
  // Simple mock authentication. In a real app, you'd check the password against a hash.
  const users = getAllUsers();
  const user = users.find(u => u.username === username);
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  }
  return null;
};

export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
};

export const updateSubscriptionStatus = (userId: number, isSubscribed: boolean): User | null => {
    const allUsers = getAllUsers();
    const userIndex = allUsers.findIndex(u => u.id === userId);
    
    if (userIndex > -1) {
        allUsers[userIndex].isSubscribed = isSubscribed;
        saveAllUsers(allUsers);
        
        // Also update the currently logged-in user session
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedCurrentUser = { ...currentUser, isSubscribed };
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrentUser));
            return updatedCurrentUser;
        }
    }
    return null;
};