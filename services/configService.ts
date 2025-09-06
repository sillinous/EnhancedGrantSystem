
import { AppConfig, MonetizationModel } from '../types';

const APP_CONFIG_KEY = 'grantfinder_appConfig';

const defaultConfig: AppConfig = {
  monetizationModel: 'Free',
};

export const getConfig = (): AppConfig => {
  try {
    const configJson = localStorage.getItem(APP_CONFIG_KEY);
    return configJson ? JSON.parse(configJson) : defaultConfig;
  } catch (error) {
    console.error("Failed to parse app config from localStorage", error);
    return defaultConfig;
  }
};

export const saveConfig = (config: AppConfig): void => {
  try {
    const configJson = JSON.stringify(config);
    localStorage.setItem(APP_CONFIG_KEY, configJson);
  } catch (error) {
    console.error("Failed to save app config to localStorage", error);
  }
};

export const setMonetizationModel = (model: MonetizationModel): void => {
  const currentConfig = getConfig();
  const newConfig = { ...currentConfig, monetizationModel: model };
  saveConfig(newConfig);
};
