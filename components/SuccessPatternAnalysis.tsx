import React from 'react';
import { GrantOpportunity, User, SuccessPatternAnalysis, AppConfig } from '../types';
import * as usageService from '../services/usageService';
import { getConfig } from '../services/configService';
import LoadingSpinner from './LoadingSpinner';
import FeatureGuard from './FeatureGuard';
import { Bot, Target, FileText, DollarSign, Lightbulb, CheckCircle, RefreshCw, Star, BarChart } from 'lucide-react';

interface SuccessPatternAnalysisProps {
  grant: GrantOpportunity;
  user: User;
  analysis: SuccessPatternAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
}

const SuccessPatternAnalysisComponent: React.FC<SuccessPatternAnalysisProps> = ({ grant, user, analysis, isLoading, error, onAnalyze }) => {
  const config = getConfig();
  const usage = (config.monetizationModel === 'UsageBased') 
    ? usageService.getUsage(user.id, 'AI Success Pattern Analysis') 
    : { remaining: 0, limit: 0 };
    
  const InsightCard: React.FC<{icon: React.ReactNode, title: string, children: React.ReactNode; className?: string}> = ({icon, title, children, className}) => (
      <div className={`bg-white p-4 rounded-lg border border-gray-200 ${className}`}>
        <h4 className="font-semibold text-gray-700 flex items-center mb-2 text-base">
            {icon}
            {title}
        </h4>
        <div className="text-sm">
            {children}
        </div>
      </div>
  );

  if (isLoading) {
    return <LoadingSpinner message="AI is analyzing past funded projects..." />;
  }

  if (error) {
    return <p className="text-sm text-red-600 p-4 bg-red-50 rounded-md">{error}</p>;
  }

  if (!analysis) {
    return (
      <div className="text-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in">
        <Bot size={32} className="mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold text-gray-800">Discover What Winners Have in Common</h3>
        <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
          Unlock a data-driven advantage. The AI will research this funder's past awards to identify patterns in successful projects, giving you a blueprint for your proposal.
        </p>
        <FeatureGuard user={user} featureName="AI Success Pattern Analysis">
          {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
            <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
              {usage.remaining}/{usage.limit} Free Analyses Remaining
            </p>
          )}
          <button onClick={onAnalyze} className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-primary px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors">
            <CheckCircle size={16} className="mr-2" />
            Analyze Success Patterns
          </button>
        </FeatureGuard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">AI Success Pattern Analysis</h3>
        </div>
        <button onClick={onAnalyze} disabled={isLoading} className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors">
          <RefreshCw size={14} className="mr-1.5" /> Re-run Analysis
        </button>
      </div>

      <InsightCard icon={<Target size={18} className="mr-2.5 text-blue-600"/>} title="Common Themes in Funded Projects">
         <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
          {analysis.commonThemes.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </InsightCard>

      <InsightCard icon={<BarChart size={18} className="mr-2.5 text-green-600"/>} title="Funded Project Types">
        <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
          {analysis.fundedProjectTypes.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </InsightCard>

      <InsightCard icon={<DollarSign size={18} className="mr-2.5 text-purple-600"/>} title="Funding Range Insights">
        <p className="text-gray-700">{analysis.fundingRangeInsights}</p>
      </InsightCard>
      
       <InsightCard icon={<FileText size={18} className="mr-2.5 text-orange-600"/>} title="Keyword Patterns in Winner Announcements">
        <div className="flex flex-wrap gap-2">
          {analysis.keywordPatterns.map((item, i) => <span key={i} className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{item}</span>)}
        </div>
      </InsightCard>

      <InsightCard 
        icon={<Star size={18} className="mr-2.5 text-yellow-500"/>} 
        title="AI Strategic Recommendations"
        className="bg-yellow-50 border-yellow-200"
      >
        <p className="text-yellow-900">{analysis.strategicRecommendations}</p>
      </InsightCard>
      
       <p className="text-xs text-gray-400 text-center"> Analysis generated on {new Date(analysis.generatedAt).toLocaleString()}. </p>
    </div>
  );
};

export default SuccessPatternAnalysisComponent;