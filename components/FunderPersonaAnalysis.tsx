import React from 'react';
import { GrantOpportunity, User, FunderPersona, AppConfig } from '../types';
import * as usageService from '../services/usageService';
import { getConfig } from '../services/configService';
import LoadingSpinner from './LoadingSpinner';
import FeatureGuard from './FeatureGuard';
import { Briefcase, Target, MessageSquare, Lightbulb, CheckCircle, RefreshCw, Star, Quote } from 'lucide-react';

interface FunderPersonaAnalysisProps {
  grant: GrantOpportunity;
  user: User;
  persona: FunderPersona | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
}

const FunderPersonaAnalysis: React.FC<FunderPersonaAnalysisProps> = ({ grant, user, persona, isLoading, error, onAnalyze }) => {
  const config = getConfig();
  const usage = (config.monetizationModel === 'UsageBased') 
    ? usageService.getUsage(user.id, 'AI Funder Persona Analysis') 
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
    return <LoadingSpinner message="AI is researching the funder's profile..." />;
  }

  if (error) {
    return <p className="text-sm text-red-600 p-4 bg-red-50 rounded-md">{error}</p>;
  }

  if (!persona) {
    return (
      <div className="text-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 animate-fade-in">
        <Briefcase size={32} className="mx-auto text-primary mb-3" />
        <h3 className="text-lg font-semibold text-gray-800">Analyze the Funder's Persona</h3>
        <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
          Go beyond the grant description. The AI will research the funder's website to reveal their core mission, priorities, and communication style, giving you a strategic advantage.
        </p>
        <FeatureGuard user={user} featureName="AI Funder Persona Analysis">
          {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
            <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
              {usage.remaining}/{usage.limit} Free Analyses Remaining
            </p>
          )}
          <button onClick={onAnalyze} className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-primary px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors">
            <CheckCircle size={16} className="mr-2" />
            Analyze Funder Persona
          </button>
        </FeatureGuard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Funder Persona: {persona.funderName}</h3>
        </div>
        <button onClick={onAnalyze} disabled={isLoading} className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors">
          <RefreshCw size={14} className="mr-1.5" /> Re-run Analysis
        </button>
      </div>

      <InsightCard icon={<Quote size={18} className="mr-2.5 text-blue-600"/>} title="Core Mission">
         <p className="text-gray-600 italic">"{persona.coreMission}"</p>
      </InsightCard>

      <InsightCard icon={<Target size={18} className="mr-2.5 text-green-600"/>} title="Key Priorities">
        <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">
          {persona.keyPriorities.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      </InsightCard>

      <InsightCard icon={<MessageSquare size={18} className="mr-2.5 text-purple-600"/>} title="Communication Style & Tone">
        <p className="text-gray-700">{persona.communicationStyle}</p>
      </InsightCard>

      <InsightCard 
        icon={<Star size={18} className="mr-2.5 text-yellow-500"/>} 
        title="AI Strategic Advice"
        className="bg-yellow-50 border-yellow-200"
      >
        <p className="text-yellow-900">{persona.strategicAdvice}</p>
      </InsightCard>
      
       <p className="text-xs text-gray-400 text-center"> Analysis generated on {new Date(persona.generatedAt).toLocaleString()}. </p>
    </div>
  );
};

export default FunderPersonaAnalysis;