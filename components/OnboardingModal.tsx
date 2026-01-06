import React from 'react';
import { X, Sparkles, Target, FileText, TrendingUp } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: <Target className="text-primary" size={32} />,
      title: "Create Your Profile",
      description: "Tell us about your organization and funding needs so we can find the best matches."
    },
    {
      icon: <Sparkles className="text-primary" size={32} />,
      title: "Discover Grants",
      description: "Our AI scouts the web to find grants tailored to your profile and goals."
    },
    {
      icon: <FileText className="text-primary" size={32} />,
      title: "Draft & Apply",
      description: "Use AI-powered tools to draft compelling proposals and manage your applications."
    },
    {
      icon: <TrendingUp className="text-primary" size={32} />,
      title: "Track & Win",
      description: "Monitor your pipeline, learn from each application, and increase your success rate."
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Welcome to GrantFinder AI</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">
            Get started in 4 simple steps to unlock AI-powered grant discovery and application tools.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="p-4 border border-gray-200 rounded-xl hover:border-primary/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {step.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{step.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
