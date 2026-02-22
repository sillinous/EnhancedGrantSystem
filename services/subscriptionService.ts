import { Subscription } from '../types';
const mockSub: Subscription = { id: 1, userId: 1, plan: 'Pro' as any, status: 'Active' as any, startDate: new Date().toISOString(), endDate: null };
export const getSubscription = async (_userId?: any) => mockSub;
export const createProSubscription = async () => mockSub;
export const cancelSubscription = async () => {};
export const upgradeSubscription = async () => mockSub;
