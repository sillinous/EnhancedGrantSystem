import React, { useState } from 'react';
import Header from './Header';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { User } from '../types';
import * as subscriptionService from '../services/subscriptionService';
import { CheckCircle, Star } from 'lucide-react';

interface PricingPageProps {
  user: User;
  onSubscriptionSuccess: (user: User) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ user, onSubscriptionSuccess }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleUpgrade = () => {
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    // Simulate API call to Stripe and our backend
    setTimeout(() => {
      const result = subscriptionService.createProSubscription(user);
      if (result) {
        setIsProcessing(false);
        setIsSuccess(true);
        setTimeout(() => {
          setIsCheckoutOpen(false);
          onSubscriptionSuccess(result.user);
          navigateTo('/app');
        }, 2000);
      }
    }, 1500);
  };

  const proFeatures = [
    "Unlimited AI Eligibility Analyses",
    "Unlimited AI Grant Writing Studio Drafts",
    "Unlimited AI Application Reviews",
    "Advanced Collaboration Tools",
    "Priority Support",
  ];

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        <Header user={user} onLogout={() => {}} isPublic={false} />
        <main className="container mx-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-800">Unlock Your Full Potential</h1>
            <p className="mt-2 text-lg text-gray-600">Choose the plan that's right for you and supercharge your grant-seeking journey.</p>
          </div>

          <div className="mt-10 max-w-lg mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-primary flex items-center justify-center"><Star size={24} className="mr-2" /> Pro Plan</h2>
                <p className="mt-4 text-4xl font-extrabold text-gray-900">$29<span className="text-xl font-medium text-gray-500">/mo</span></p>
                <p className="mt-2 text-sm text-gray-500">Billed monthly. Cancel anytime.</p>
            </div>
            <ul className="mt-8 space-y-3 text-sm">
                {proFeatures.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                    </li>
                ))}
            </ul>
            <button
              onClick={handleUpgrade}
              className="mt-8 w-full bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-transform hover:scale-105"
            >
              Upgrade to Pro
            </button>
          </div>
        </main>
      </div>
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Complete Your Upgrade"
      >
        {isSuccess ? (
          <div className="text-center p-8">
            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-bold">Payment Successful!</h3>
            <p className="text-gray-600 mt-2">Welcome to Pro! You now have access to all premium features. Redirecting...</p>
          </div>
        ) : isProcessing ? (
          <LoadingSpinner message="Processing your payment securely..." />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">This is a simulated checkout process. No real payment will be made.</p>
            {/* Mock Credit Card Form */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Card Number</label>
              <input type="text" placeholder="**** **** **** 4242" className="w-full p-2 border rounded-md bg-gray-100" disabled />
            </div>
             <div className="flex gap-4">
                <div className="w-1/2 space-y-2">
                    <label className="text-xs font-medium">Expiry Date</label>
                    <input type="text" placeholder="MM / YY" className="w-full p-2 border rounded-md bg-gray-100" disabled />
                </div>
                 <div className="w-1/2 space-y-2">
                    <label className="text-xs font-medium">CVC</label>
                    <input type="text" placeholder="123" className="w-full p-2 border rounded-md bg-gray-100" disabled />
                </div>
            </div>
            <button
              onClick={handleConfirmPayment}
              className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700"
            >
              Confirm Payment
            </button>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PricingPage;