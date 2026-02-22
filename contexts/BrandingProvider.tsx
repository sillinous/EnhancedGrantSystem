import React, { createContext, useContext, useState } from 'react';

interface Branding { name?: string; color?: string }
interface BrandingContextType { branding: Branding; setBranding: (b: Branding) => void }
const BrandingContext = createContext<BrandingContextType>({ branding: {}, setBranding: () => {} });

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<Branding>({});
  return <BrandingContext.Provider value={{ branding, setBranding }}>{children}</BrandingContext.Provider>;
};

export const useBranding = () => useContext(BrandingContext);
