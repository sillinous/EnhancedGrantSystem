import { AppConfig } from '../types';
const defaultConfig: AppConfig = {
  monetizationModel: 'Unlimited' as any,
  features: {} as any,
  enabledSSOProviders: [],
};
export const getConfig = (): AppConfig => defaultConfig;
export const setMonetizationModel = (_m: any) => {};
export const updateConfig = (_c: Partial<AppConfig>) => {};
