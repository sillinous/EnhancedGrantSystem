import React from 'react';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature?: string;
  featureName?: string;
  user?: any;
  config?: any;
  fallback?: React.ReactNode;
}

// All features unlocked — Grant OS Pro
const FeatureGuard: React.FC<FeatureGuardProps> = ({ children }) => <>{children}</>;
export default FeatureGuard;
