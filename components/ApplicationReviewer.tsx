import React, { useState, useEffect } from 'react';
import { GrantOpportunity, FundingProfile, User, ApplicationReview, RedTeamReview, DifferentiationAnalysis, CohesionAnalysis, AppConfig } from '../types';
import * as reviewService from '../services/reviewService';
import * as draftService from '../services/draftService';
import * as budgetService from '../services/budgetService';
import * as usageService from '../services/usageService';
import * as differentiationService from '../services/differentiationService';
import * as cohesionService from '../services/cohesionService';
import { getConfig } from '../services/configService';
import { reviewApplication, runRedTeamReview, analyzeDifferentiation, analyzeProposalCohesion } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import FeatureGuard from './FeatureGuard';
import { Star, ThumbsUp, Lightbulb, CheckCircle, BarChart, RefreshCw, ShieldAlert, AlertTriangle, MessageCircleQuestion, Zap, BarChartBig, Handshake, Link2 } from 'lucide-react';

interface ApplicationReviewerProps {
  grant: GrantOpportunity;
  profile: FundingProfile;
  user: User;
}

const ApplicationReviewer: React.FC<ApplicationReviewerProps> = ({ grant, profile, user }) => {
  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [redTeamReview, setRedTeamReview] = useState<RedTeamReview | null>(null);
  const [differentiationAnalysis, setDifferentiationAnalysis] = useState<DifferentiationAnalysis | null>(null);
  const [cohesionAnalysis, setCohesionAnalysis] = useState<CohesionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<'constructive' | 'red_team' | 'differentiation' | 'cohesion'>('constructive');

  const [config] = useState<AppConfig>(getConfig());
  const [usage, setUsage] = useState({
    constructive: { remaining: 0, limit: 5 },
    red_team: { remaining: 0, limit: 5 },
    differentiation: { remaining: 0, limit: 5 },
    cohesion: { remaining: 0, limit: 5 },
  });

  useEffect(() => {
    setReview(reviewService.getReview(grant));
    setRedTeamReview(reviewService.getRedTeamReview(grant));
    setDifferentiationAnalysis(differentiationService.getDifferentiationAnalysis(grant));
    setCohesionAnalysis(cohesionService.getCohesionAnalysis(grant));
    if (config.monetizationModel === 'UsageBased') {
      setUsage({
          constructive: usageService.getUsage(user.id, 'AI Application Reviewer'),
          red_team: usageService.getUsage(user.id, 'AI Red Team Review'),
          differentiation: usageService.getUsage(user.id, 'AI Differentiation Advisor'),
          cohesion: usageService.getUsage(user.id, 'AI Cohesion Analyzer'),
      });
    }
  }, [grant, user.id, config.monetizationModel]);

  const handleAnalysisRequest = async () => {
    setError(null);
    setIsLoading(true);

    const drafts = draftService.getDrafts(grant);
    if (drafts.length === 0) {
        setError("No drafts available to analyze. Please save some drafts from the AI Assistant first.");
        setIsLoading(false);
        return;
    }

    if (activeMode === 'constructive') {
        if (config.monetizationModel === 'UsageBased') {
            const currentUsage = usageService.getUsage(user.id, 'AI Application Reviewer');
            if(currentUsage.remaining <= 0) { setIsLoading(false); return; }
            usageService.recordUsage(user.id, 'AI Application Reviewer');
            setUsage(prev => ({ ...prev, constructive: usageService.getUsage(user.id, 'AI Application Reviewer')}));
        }
        try {
            const newReview = await reviewApplication(grant, drafts);
            reviewService.saveReview(grant, newReview);
            setReview(newReview);
        } catch (e) {
            console.error("Failed to review application:", e);
            setError("The AI couldn't complete the constructive review. Please try again.");
        }
    } else if (activeMode === 'red_team') {
         if (config.monetizationModel === 'UsageBased') {
            const currentUsage = usageService.getUsage(user.id, 'AI Red Team Review');
            if(currentUsage.remaining <= 0) { setIsLoading(false); return; }
            usageService.recordUsage(user.id, 'AI Red Team Review');
            setUsage(prev => ({...prev, red_team: usageService.getUsage(user.id, 'AI Red Team Review')}));
        }
        try {
            const newReview = await runRedTeamReview(grant, drafts);
            reviewService.saveRedTeamReview(grant, newReview);
            setRedTeamReview(newReview);
        } catch (e) {
            console.error("Failed to run red team review:", e);
            setError("The AI couldn't complete the Red Team review. Please try again.");
        }
    } else if (activeMode === 'differentiation') {
        if (config.monetizationModel === 'UsageBased') {
            const currentUsage = usageService.getUsage(user.id, 'AI Differentiation Advisor');
            if(currentUsage.remaining <= 0) { setIsLoading(false); return; }
            usageService.recordUsage(user.id, 'AI Differentiation Advisor');
            setUsage(prev => ({...prev, differentiation: usageService.getUsage(user.id, 'AI Differentiation Advisor')}));
        }
        try {
            const newAnalysis = await analyzeDifferentiation(grant, drafts);
            differentiationService.saveDifferentiationAnalysis(grant, newAnalysis);
            setDifferentiationAnalysis(newAnalysis);
        } catch (e) {
            console.error("Failed to run differentiation analysis:", e);
            setError("The AI couldn't complete the Differentiation analysis. Please try again.");
        }
    } else { // cohesion mode
         if (config.monetizationModel === 'UsageBased') {
            const currentUsage = usageService.getUsage(user.id, 'AI Cohesion Analyzer');
            if(currentUsage.remaining <= 0) { setIsLoading(false); return; }
            usageService.recordUsage(user.id, 'AI Cohesion Analyzer');
            setUsage(prev => ({...prev, cohesion: usageService.getUsage(user.id, 'AI Cohesion Analyzer')}));
        }
        try {
            const budgetItems = budgetService.getBudgetItems(grant);
            const newAnalysis = await analyzeProposalCohesion(grant, drafts, budgetItems);
            cohesionService.saveCohesionAnalysis(grant, newAnalysis);
            setCohesionAnalysis(newAnalysis);
        } catch (e) {
            console.error("Failed to run cohesion analysis:", e);
            setError("The AI couldn't complete the Cohesion analysis. Please try again.");
        }
    }

    setIsLoading(false);
  };

  const constructiveScoreStyles: Record<ApplicationReview['overallScore'], string> = {
    'Strong Contender': 'bg-green-100 text-green-800 border-green-200',
    'Promising': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Needs Revision': 'bg-red-100 text-red-800 border-red-200',
  };
  
  const redTeamRiskStyles: Record<RedTeamReview['overallRisk'], string> = {
    'High': 'bg-red-100 text-red-800 border-red-200',
    'Medium': 'bg-orange-100 text-orange-800 border-orange-200',
    'Low': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const cohesionSeverityStyles = {
    'Critical': { icon: <AlertTriangle size={16} className="text-red-600"/>, text: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200' },
    'Warning': { icon: <AlertTriangle size={16} className="text-orange-600"/>, text: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
    'Suggestion': { icon: <Lightbulb size={16} className="text-blue-600"/>, text: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
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
  
  const renderInitialView = () => (
      <div className="text-center bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
          {activeMode === 'constructive' && (
              <>
                <Star size={32} className="mx-auto text-primary mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">Get an Expert AI Review</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
                    Submit your saved drafts for a comprehensive review. Our AI will act as a grant committee member to give you a score, identify strengths, and provide actionable feedback.
                </p>
                <FeatureGuard user={user} featureName="AI Application Reviewer">
                    {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
                        <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
                            {usage.constructive.remaining}/{usage.constructive.limit} Free Reviews Remaining
                        </p>
                    )}
                    <button onClick={handleAnalysisRequest} className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-primary px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors">
                        <CheckCircle size={16} className="mr-2" />
                        Submit for AI Review
                    </button>
                </FeatureGuard>
              </>
          )}
          {activeMode === 'red_team' && (
               <>
                <ShieldAlert size={32} className="mx-auto text-red-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">Run an Adversarial "Red Team" Review</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
                    Stress-test your application. The AI will adopt a highly critical persona to find every flaw, vulnerability, and logical gap, preparing you for the toughest questions.
                </p>
                 <FeatureGuard user={user} featureName="AI Red Team Review">
                    {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
                        <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
                            {usage.red_team.remaining}/{usage.red_team.limit} Free Reviews Remaining
                        </p>
                    )}
                    <button onClick={handleAnalysisRequest} className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-red-600 px-5 py-2.5 rounded-full hover:bg-red-700 transition-colors">
                        <AlertTriangle size={16} className="mr-2" />
                        Run Red Team Analysis
                    </button>
                </FeatureGuard>
               </>
          )}
          {activeMode === 'differentiation' && (
            <>
                <Zap size={32} className="mx-auto text-purple-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">Get a "Competitive Differentiation" Report</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
                    Make your proposal unforgettable. The AI will analyze your drafts and suggest innovative angles, alternative success metrics, and strategic partnerships to help you stand out.
                </p>
                 <FeatureGuard user={user} featureName="AI Differentiation Advisor">
                    {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
                        <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
                            {usage.differentiation.remaining}/{usage.differentiation.limit} Free Analyses Remaining
                        </p>
                    )}
                    <button onClick={handleAnalysisRequest} className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-purple-600 px-5 py-2.5 rounded-full hover:bg-purple-700 transition-colors">
                        <Zap size={16} className="mr-2" />
                        Find My Unique Edge
                    </button>
                </FeatureGuard>
            </>
          )}
           {activeMode === 'cohesion' && (
            <>
                <Link2 size={32} className="mx-auto text-indigo-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-800">Run a Proposal Cohesion Analysis</h3>
                <p className="text-sm text-gray-600 mt-1 mb-4 max-w-md mx-auto">
                    Ensure your entire application is flawless. The AI will read all drafts and budget items to find inconsistencies in numbers, goals, and timelines across documents.
                </p>
                 <FeatureGuard user={user} featureName="AI Cohesion Analyzer">
                    {config.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
                        <p className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full inline-block mb-3">
                            {usage.cohesion.remaining}/{usage.cohesion.limit} Free Analyses Remaining
                        </p>
                    )}
                    <button onClick={handleAnalysisRequest} className="flex items-center justify-center mx-auto text-sm font-medium text-white bg-indigo-600 px-5 py-2.5 rounded-full hover:bg-indigo-700 transition-colors">
                        <CheckCircle size={16} className="mr-2" />
                        Analyze for Cohesion
                    </button>
                </FeatureGuard>
            </>
          )}
      </div>
  );

  return (
    <div className="animate-fade-in space-y-4">
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            <button onClick={() => setActiveMode('constructive')} className={`w-1/4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeMode === 'constructive' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-white/50'}`}>Constructive</button>
            <button onClick={() => setActiveMode('red_team')} className={`w-1/4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeMode === 'red_team' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-white/50'}`}>Red Team</button>
            <button onClick={() => setActiveMode('differentiation')} className={`w-1/4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeMode === 'differentiation' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-white/50'}`}>Differentiation</button>
            <button onClick={() => setActiveMode('cohesion')} className={`w-1/4 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeMode === 'cohesion' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-white/50'}`}>Cohesion</button>
        </div>

      {isLoading && <LoadingSpinner message={
          activeMode === 'constructive' ? "AI is reviewing your application..." :
          activeMode === 'red_team' ? "Red Team is analyzing for weaknesses..." :
          activeMode === 'differentiation' ? "AI is brainstorming unique angles..." :
          "AI is checking for inconsistencies..."
      } />}
      {error && <p className="text-sm text-red-600 p-4 bg-red-50 rounded-md">{error}</p>}
      
      {activeMode === 'constructive' && !review && !isLoading && renderInitialView()}
      {activeMode === 'red_team' && !redTeamReview && !isLoading && renderInitialView()}
      {activeMode === 'differentiation' && !differentiationAnalysis && !isLoading && renderInitialView()}
      {activeMode === 'cohesion' && !cohesionAnalysis && !isLoading && renderInitialView()}
      
      {activeMode === 'constructive' && review && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">AI Application Review</h3>
                <button onClick={handleAnalysisRequest} disabled={isLoading} className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors">
                    <RefreshCw size={14} className="mr-1.5" /> Re-run Review
                </button>
            </div>
             <InsightCard icon={<BarChart size={18} className="mr-2.5 text-blue-600"/>} title="Overall Score">
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${constructiveScoreStyles[review.overallScore]}`}> {review.overallScore} </span>
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
            <p className="text-xs text-gray-400 text-center"> Review generated on {new Date(review.generatedAt).toLocaleString()}. </p>
        </div>
      )}

       {activeMode === 'red_team' && redTeamReview && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Red Team Analysis</h3>
                <button onClick={handleAnalysisRequest} disabled={isLoading} className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors">
                    <RefreshCw size={14} className="mr-1.5" /> Re-run Analysis
                </button>
            </div>
             <InsightCard icon={<ShieldAlert size={18} className="mr-2.5 text-red-600"/>} title="Overall Risk Assessment">
                <span className={`px-3 py-1 text-sm font-bold rounded-full border ${redTeamRiskStyles[redTeamReview.overallRisk]}`}> {redTeamReview.overallRisk} Risk </span>
            </InsightCard>
             <InsightCard icon={<AlertTriangle size={18} className="mr-2.5 text-orange-600"/>} title="Identified Vulnerabilities">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {redTeamReview.vulnerabilities.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
             <InsightCard icon={<MessageCircleQuestion size={18} className="mr-2.5 text-indigo-600"/>} title="Probing Questions from the Committee">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {redTeamReview.probingQuestions.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
            <p className="text-xs text-gray-400 text-center"> Analysis generated on {new Date(redTeamReview.generatedAt).toLocaleString()}. </p>
        </div>
      )}

      {activeMode === 'differentiation' && differentiationAnalysis && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Differentiation Advisor</h3>
                <button onClick={handleAnalysisRequest} disabled={isLoading} className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors">
                    <RefreshCw size={14} className="mr-1.5" /> Re-run Analysis
                </button>
            </div>
             <InsightCard icon={<Zap size={18} className="mr-2.5 text-purple-600"/>} title="Innovative Angles to Consider">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {differentiationAnalysis.innovativeAngles.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
             <InsightCard icon={<BarChartBig size={18} className="mr-2.5 text-blue-600"/>} title="Alternative Success Metrics">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {differentiationAnalysis.alternativeMetrics.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
             <InsightCard icon={<Handshake size={18} className="mr-2.5 text-green-600"/>} title="Strategic Partnership Suggestions">
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 pl-2">
                    {differentiationAnalysis.partnershipSuggestions.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </InsightCard>
            <p className="text-xs text-gray-400 text-center"> Analysis generated on {new Date(differentiationAnalysis.generatedAt).toLocaleString()}. </p>
        </div>
      )}

      {activeMode === 'cohesion' && cohesionAnalysis && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Cohesion Analysis Report</h3>
                <button onClick={handleAnalysisRequest} disabled={isLoading} className="flex items-center text-xs font-medium text-primary hover:bg-primary/10 px-2 py-1.5 rounded-md transition-colors">
                    <RefreshCw size={14} className="mr-1.5" /> Re-run Analysis
                </button>
            </div>
            {cohesionAnalysis.findings.length > 0 ? (
                <div className="space-y-3">
                    {cohesionAnalysis.findings.map((finding, index) => {
                        const styles = cohesionSeverityStyles[finding.severity];
                        return (
                            <div key={index} className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}>
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">{styles.icon}</div>
                                    <div>
                                        <p className={`font-semibold ${styles.text}`}>{finding.severity}:</p>
                                        <p className="text-sm text-gray-800">{finding.finding}</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {finding.sections.map(section => (
                                                <span key={section} className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{section}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle size={24} className="mx-auto text-green-600 mb-2"/>
                    <h4 className="font-semibold text-green-800">No Inconsistencies Found</h4>
                    <p className="text-sm text-green-700">The AI has analyzed all your documents and found no major contradictions. Your application appears to be well-aligned.</p>
                </div>
            )}
             <p className="text-xs text-gray-400 text-center"> Analysis generated on {new Date(cohesionAnalysis.generatedAt).toLocaleString()}. </p>
        </div>
      )}
    </div>
  );
};

export default ApplicationReviewer;