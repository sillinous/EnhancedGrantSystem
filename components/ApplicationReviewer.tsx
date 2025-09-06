import React, { useState, useEffect } from 'react';
// FIX: Replaced non-existent 'BusinessProfile' type with the correct 'FundingProfile' type.
import { GrantOpportunity, FundingProfile, User, ApplicationReview, AppConfig } from '../types';
import * as reviewService from '../services/reviewService';
import * as draftService from '../services/draftService';
import * as usageService from '../services/usageService';
import { getConfig } from '../services/configService';
import { reviewApplication } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import FeatureGuard from './FeatureGuard';
import { Star, ThumbsUp, Lightbulb, CheckCircle, BarChart, RefreshCw } from 'lucide-react';

interface ApplicationReviewerProps {
  grant: GrantOpportunity;
  // FIX: Replaced non-existent 'BusinessProfile' type with the correct 'FundingProfile' type.
  profile: FundingProfile;
  user: User;
}

const ApplicationReviewer: React.FC<ApplicationReviewerProps> = ({ grant, profile, user }) => {
  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [config] = useState<AppConfig>(getConfig());
  const [usage, setUsage] = useState({ remaining: 0, limit: 5 });

  useEffect(() => {
    setReview(reviewService.getReview(grant));
    if (config.monetizationModel === 'UsageBased') {
      setUsage(usageService.getUsage(user.id, 'AI Application Reviewer'));
    }
  }, [grant, user.id, config.monetizationModel]);

  const handleReviewRequest = async () => {
    setError(null);
    setIsLoading(true);

    if (config.monetizationModel === 'UsageBased') {
        const currentUsage = usageService.getUsage(user.id, 'AI Application Reviewer');
        if(currentUsage.remaining <= 0) {
            setIsLoading(false);
            return;
        }
        usageService.recordUsage(user.id, 'AI Application Reviewer');
        setUsage(usageService.getUsage(user.id, 'AI Application Reviewer'));
    }

    try {
      const drafts = draftService.getDrafts(grant);
      if (drafts.length === 0) {
        throw new Error("No drafts available to review.");
      }
      const newReview = await reviewApplication(grant, drafts);
      reviewService.saveReview(grant, newReview);
      setReview(newReview);
    } catch (e) {
      console.error("Failed to review application:", e);
      setError("The AI couldn't complete the review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const scoreStyles: Record<ApplicationReview['overallScore'], string> = {
    'Strong Contender': 'bg-green-100 text-green-800 border-green-200',
    'Promising': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Needs Revision': 'bg-red-100 text-red-800 border-red-200',
  };

  const InsightCard: React.FC<{icon: React.ReactNode, title: string, children: React.ReactNode}> = ({icon, title, children}) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-700 flex items-center mb-2">
          {icon}
          {title}
      </h4>
      {children}
    </div>
  );

  return (
    <div className="animate-fade-in">
      {!review && !isLoading && (
        <div className="text-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          <Star size={32} className="mx-auto text-primary mb-3" />
          <h3 className="text-lg font-semibold text-gray-800">Get an Expert AI Review</h3>
          <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
            Submit your saved drafts for a comprehensive review. Our AI will act as a grant committee member to give you a score, identify strengths, and provide actionable feedback.
          </p>
          <FeatureGuard user={user} featureName="AI Application Reviewer">
             {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
                <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
                    {usage.remaining}/{usage.limit} Free Reviews Remaining
                </p>
            )}
            <button
              onClick={handleReviewRequest}
              className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-primary px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors"
            >
              <CheckCircle size={16} className="mr-2" />
              Submit for AI Review
            </button>
          </FeatureGuard>
        </div>
      )}

      {isLoading && <LoadingSpinner message="AI is reviewing your application..." />}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {review && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">AI Application Review</h3>
                <button 
                    onClick={handleReviewRequest} 
                    disabled={isLoading}
                    className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors"
                >
                    <RefreshCw size={14} className="mr-1.5" />
                    Re-run Review
                </button>
            </div>
             <InsightCard icon={<BarChart size={18} className="mr-2.5 text-blue-600"/>} title="Overall Score">
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${scoreStyles[review.overallScore]}`}>
                    {review.overallScore}
                </span>
            </InsightCard>
             <InsightCard icon={<ThumbsUp size={18} className="mr-2.5 text-green-600"/>} title="Core Strengths">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {review.strengths.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
             <InsightCard icon={<Lightbulb size={18} className="mr-2.5 text-yellow-600"/>} title="Actionable Recommendations">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {review.recommendations.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
            <p className="text-xs text-gray-400 text-center">
                Review generated on {new Date(review.generatedAt).toLocaleString()}.
            </p>
        </div>
      )}
    </div>
  );
};

export default ApplicationReviewer;