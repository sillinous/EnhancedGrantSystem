import React from 'react';
import { User } from '../types';
import { getConfig } from '../services/configService';
import * as usageService from '../services/usageService';
import { Lock, Zap, Hourglass } from 'lucide-react';

interface FeatureGuardProps {
  user: User;
  featureName: string;
  children: React.ReactNode;
}

const FeatureGuard: React.FC<FeatureGuardProps> = ({ user, featureName, children }) => {
  const { monetizationModel } = getConfig();

  const navigateToPricing = () => {
    window.history.pushState({}, '', '/pricing');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (monetizationModel === 'Free' || user.role === 'Admin') {
    return <>{children}</>;
  }

  if (monetizationModel === 'UsageBased') {
    const usage = usageService.getUsage(user.id, featureName);
    if (usage.remaining > 0) {
      return <>{children}</>;
    } else {
      return (
        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <Hourglass size={20} className="mx-auto text-orange-600 mb-2" />
          <h4 className="font-bold text-orange-800">Monthly Limit Reached</h4>
          <p className="text-sm text-orange-700">You've used all your free {featureName} credits for this month.</p>
          <button 
            onClick={navigateToPricing}
            className="mt-3 px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-full shadow-sm hover:bg-blue-700"
          >
            Upgrade to Pro for Unlimited Access
          </button>
        </div>
      );
    }
  }

  if (monetizationModel === 'Subscription') {
    if (user.isSubscribed) {
      return <>{children}</>;
    } else {
      return (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Lock size={20} className="mx-auto text-yellow-600 mb-2" />
          <h4 className="font-bold text-yellow-800">{featureName} is a Pro feature.</h4>
          <p className="text-sm text-yellow-700">Upgrade to Pro to unlock this and other powerful tools.</p>
          <button 
            onClick={navigateToPricing}
            className="mt-3 px-4 py-1.5 text-sm font-semibold text-white bg-primary rounded-full shadow-sm hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      );
    }
  }

  if (monetizationModel === 'PayPerFeature') {
    // In a real app, you'd check if the user has purchased this specific feature.
    // For this demo, we'll assume they have not.
    return (
        <div className="text-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <Zap size={20} className="mx-auto text-indigo-600 mb-2" />
          <h4 className="font-bold text-indigo-800">Unlock {featureName}</h4>
          <p className="text-sm text-indigo-700">Get one-time access to this powerful AI tool.</p>
          <button 
            onClick={navigateToPricing}
            className="mt-3 px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded-full shadow-sm hover:bg-indigo-700"
          >
            Unlock for $X.XX
          </button>
        </div>
    );
  }

  return <>{children}</>;
};

export default FeatureGuard;