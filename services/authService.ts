
export { getUser, isAuthenticated, mockUser } from './store';
export const getToken = () => 'local';
export const verifySession = async () => (await import('./store')).mockUser;
export const logout = () => {};
export const login = async (u: string, p: string) => (await import('./store')).mockUser;
export const getImpersonator = () => null;
export const stopImpersonation = async () => {};
