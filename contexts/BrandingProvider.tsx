import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { BrandingSettings } from '../types';

interface BrandingContextType {
  branding: BrandingSettings;
  setBranding: (settings: BrandingSettings) => void;
  resetBranding: () => void;
}

// Default branding settings match the initial Tailwind config
const defaultBranding: BrandingSettings = {
  primaryColor: '#0052cc',
  logoUrl: '',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  setBranding: () => {},
  resetBranding: () => {},
});

export const useBranding = () => useContext(BrandingContext);

interface BrandingProviderProps {
  children: ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const [branding, setBrandingState] = useState<BrandingSettings>(defaultBranding);

  useEffect(() => {
    // Apply the primary color as a CSS variable to the root element for Tailwind to use
    document.documentElement.style.setProperty('--color-primary', branding.primaryColor);
  }, [branding.primaryColor]);

  const setBranding = useCallback((settings: BrandingSettings) => {
    setBrandingState(settings);
  }, []);

  const resetBranding = useCallback(() => {
    setBrandingState(defaultBranding);
  }, []);

  const value = {
    branding,
    setBranding,
    resetBranding,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};
