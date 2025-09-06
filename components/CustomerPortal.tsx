import React, { useState, useEffect } from 'react';
import Header from './Header';
import { User, Subscription } from '../types';
import * as subscriptionService from '../services/subscriptionService';
import { Star, XCircle } from 'lucide-react';

interface CustomerPortalProps {
  user: User;
  onSubscriptionChange: (user: User) => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ user, onSubscriptionChange }) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    setSubscription(subscriptionService.getSubscription(user.id));
  }, [user.id]);

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your Pro subscription? You will lose access to premium features at the end of your billing period.')) {
        const updatedSub = subscriptionService.cancelSubscription(user.id);
        setSubscription(updatedSub);
        // In a real app, this user update might come from a webhook or API call
        const updatedUser = { ...user, isSubscribed: false };
        onSubscriptionChange(updatedUser);
    }
  };

  const handleReactivate = () => {
    const result = subscriptionService.createProSubscription(user);
    if (result) {
        setSubscription(result.subscription);
        onSubscriptionChange(result.user);
    }
  };

  if (!subscription) {
    return null; // Or a loading state
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header user={user} onLogout={() => {}} isPublic={false} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">Account Management</h1>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Subscription</h2>
            <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan:</span>
                    <span className={`font-bold px-3 py-1 rounded-full text-xs ${subscription.plan === 'Pro' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {subscription.plan}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                     <span className={`font-semibold ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                       {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </span>
                </div>
                {subscription.plan === 'Pro' && (
                     <div className="flex justify-between items-center">
                        <span className="text-gray-600">Next Billing Date:</span>
                         <span className="font-semibold">
                           {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              {subscription.plan === 'Pro' && subscription.status === 'active' && (
                <button
                    onClick={handleCancel}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors"
                >
                    <XCircle size={18} />
                    Cancel Pro Subscription
                </button>
              )}
              {subscription.status === 'canceled' && (
                 <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Your subscription is canceled and will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.</p>
                    <button
                        onClick={handleReactivate}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Star size={18} />
                        Reactivate Pro Plan
                    </button>
                 </div>
              )}
               {subscription.plan === 'Free' && (
                 <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">You are on the Free plan.</p>
                    <button
                        onClick={() => { window.history.pushState({}, '', '/pricing'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Star size={18} />
                        Upgrade to Pro
                    </button>
                 </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerPortal;