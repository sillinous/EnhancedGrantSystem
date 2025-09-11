import React, { useState, useEffect, useCallback } from 'react';
import { GrantOpportunity, FundingProfile, GroundingSource, EligibilityReport, GrantStatus, LifecycleStage, LifecycleInsights, User, AppConfig, ActivityLog, FunderPersona, SuccessPatternAnalysis, GrantDraft, BudgetItem, ChecklistItem, Document, Expense, ReportingRequirement, DifferentiationAnalysis, CohesionAnalysis, ApplicationReview, RedTeamReview } from '../types';
import * as draftService from '../services/draftService';
import * as usageService from '../services/usageService';
import * as activityService from '../services/activityService';
import * as personaService from '../services/personaService';
import * as successPatternService from '../services/successPatternService';
import * as differentiationService from '../services/differentiationService';
import * as cohesionService from '../services/cohesionService';
import * as reviewService from '../services/reviewService';
import { getConfig } from '../services/configService';
import * as geminiService from '../services/geminiService';
import { createCalendarFile } from '../services/calendarService';
import ChatAssistant from './ChatAssistant';
import Checklist from './Checklist';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import DocumentManager from './DocumentManager';
import DraftsManager from './DraftsManager';
import ReportingManager from './ReportingManager';
import ApplicationReviewer from './ApplicationReviewer';
import GrantLifecycleTracker from './GrantLifecycleTracker';
import FeatureGuard from './FeatureGuard';
import ShareButton from './ShareButton';
import ActivityFeed from './ActivityFeed';
import BudgetAssistant from './BudgetAssistant';
import FunderPersonaAnalysis from './FunderPersonaAnalysis';
import SuccessPatternAnalysisComponent from './SuccessPatternAnalysis';
import { useToast } from '../hooks/useToast';
import { Link, Info, Sparkles, ThumbsUp, AlertTriangle, Lightbulb, ShieldCheck, CalendarClock, ChevronDown, FolderKanban, Columns, CheckSquare, MessageSquare, BookText, FileBarChart2, CalendarPlus, Map, CheckCircle2, Milestone, Star, Award, Target, History, Wallet, Briefcase, Bot } from 'lucide-react';

const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const statusOptions: GrantStatus[] = ['Interested', 'Applying', 'Submitted', 'Awarded', 'Rejected'];
type DetailTab = 'Lifecycle' | 'Funder Persona' | 'Success Patterns' | 'Analysis' | 'Checklist' | 'Drafts' | 'Budget' | 'Review' | 'Assistant' | 'Reporting' | 'Activity';

interface GrantDetailViewProps {
  grant: (GrantOpportunity & { status: GrantStatus }) | null;
  profile: FundingProfile;
  onClose: () => void;
  sources: GroundingSource[];
  onStatusChange: (grant: GrantOpportunity, status: GrantStatus) => Promise<void>;
  user: User;
}

const GrantDetailView: React.FC<GrantDetailViewProps> = ({ grant, profile, onClose, sources, onStatusChange, user }) => {
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [eligibilityReport, setEligibilityReport] = useState<EligibilityReport | null>(null);
  const [isDocManagerOpen, setIsDocManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('Analysis');
  const [hasDrafts, setHasDrafts] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LifecycleStage | null>(null);
  const [lifecycleInsights, setLifecycleInsights] = useState<LifecycleInsights | null>(null);
  const [isFetchingInsights, setIsFetchingInsights] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [funderPersona, setFunderPersona] = useState<FunderPersona | null>(null);
  const [successPatternAnalysis, setSuccessPatternAnalysis] = useState<SuccessPatternAnalysis | null>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [usage, setUsage] = useState({ remaining: 0, limit: 5 });
  const { showToast } = useToast();

  const grantId = grant ? getGrantId(grant) : null;

  const logActivity = useCallback(async (action: string) => {
    if (!grantId) return;
    try {
      await activityService.logActivity(grantId, user, action);
      setActivityLog(await activityService.getActivitiesForGrant(grantId));
    } catch (error) {
        showToast('Failed to log activity.', 'error');
    }
  }, [grantId, user, showToast]);
  
  const loadGrantData = useCallback(async (grantId: string) => {
    setIsDataLoading(true);
    try {
        const [draftsData, activities, persona, successPatterns, appConfig] = await Promise.all([
            draftService.getDrafts(grantId),
            activityService.getActivitiesForGrant(grantId),
            personaService.getPersona(grantId),
            successPatternService.getSuccessPatternAnalysis(grantId),
            getConfig()
        ]);
        setHasDrafts(draftsData.length > 0);
        setActivityLog(activities);
        setFunderPersona(persona);
        setSuccessPatternAnalysis(successPatterns);
        setConfig(appConfig);
    } catch (error) {
        console.error("Failed to load grant data:", error);
        showToast('Failed to load grant details.', 'error');
    } finally {
        setIsDataLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setEligibilityReport(null);
    setSelectedStage(null);
    setLifecycleInsights(null);
    setIsFetchingInsights(false);
    setFunderPersona(null);
    setSuccessPatternAnalysis(null);
    
    if (grant && grantId) {
        loadGrantData(grantId);
        setActiveTab(grant.status === 'Awarded' ? 'Reporting' : 'Analysis');
    } else {
        setIsDataLoading(false);
    }
    
    const fetchUsage = async () => {
        // FIX: The `getUsage` service function requires a `userId` as the first argument.
        if (config?.monetizationModel === 'UsageBased' && user.id) {
            // FIX: The `getUsage` service function requires a `userId` as the first argument.
            const usageData = await usageService.getUsage(user.id, 'AI Eligibility Analysis');
            setUsage(usageData);
        }
    };
    fetchUsage();

  }, [grant, grantId, user.id, config?.monetizationModel, loadGrantData]);
  
  const handleStatusChange = async (newStatus: GrantStatus) => {
      if (!grant) return;
      await onStatusChange(grant, newStatus);
      logActivity(`updated status to '${newStatus}'`);
      if (newStatus === 'Awarded') {
          setActiveTab('Reporting');
      }
  };

  const handleCheckEligibility = async () => {
    if (!grant || !config) return;
    
    if (config.monetizationModel === 'UsageBased') {
        // FIX: The `getUsage` service function requires a `userId` as the first argument.
        const currentUsage = await usageService.getUsage(user.id, 'AI Eligibility Analysis');
        if(currentUsage.remaining <= 0) {
            showToast('You have reached your monthly limit for this feature.', 'info');
            return;
        }
        // FIX: The `recordUsage` service function requires a `userId` as the first argument.
        await usageService.recordUsage(user.id, 'AI Eligibility Analysis');
        // FIX: The `getUsage` service function requires a `userId` as the first argument.
        setUsage(await usageService.getUsage(user.id, 'AI Eligibility Analysis'));
    }
    logActivity("ran AI Eligibility Analysis");
    setIsDataLoading(true);
    setEligibilityReport(null);
    setActiveTab('Analysis');
    try {
      const report = await geminiService.checkEligibility(profile, grant);
      setEligibilityReport(report);
    } catch (e) {
      console.error("Failed to check eligibility:", e);
      showToast("The AI couldn't complete the analysis. Please try again.", 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

    const handleAnalyzeFunderPersona = async () => {
    if (!grant || !grantId) return;
    logActivity("ran AI Funder Persona Analysis");
    setIsDataLoading(true);
    setFunderPersona(null);
    setActiveTab('Funder Persona');
    try {
      const persona = await geminiService.analyzeFunderPersona(grant);
      await personaService.savePersona(grantId, persona);
      setFunderPersona(persona);
    } catch (e) {
      console.error("Failed to analyze funder persona:", e);
      showToast("The AI couldn't analyze the funder persona. Please try again.", 'error');
    } finally {
      setIsDataLoading(false);
    }
  };
  
    const handleAnalyzeSuccessPatterns = async () => {
    if (!grant || !grantId) return;
    logActivity("ran AI Success Pattern Analysis");
    setIsDataLoading(true);
    setSuccessPatternAnalysis(null);
    setActiveTab('Success Patterns');
    try {
      const analysis = await geminiService.analyzeSuccessPatterns(grant);
      await successPatternService.saveSuccessPatternAnalysis(grantId, analysis);
      setSuccessPatternAnalysis(analysis);
    } catch (e) {
      console.error("Failed to analyze success patterns:", e);
      showToast("The AI couldn't analyze success patterns. Please try again.", 'error');
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleStageSelect = async (stage: LifecycleStage) => {
    if (!grant) return;
    setSelectedStage(stage);
    setLifecycleInsights(null);
    setIsFetchingInsights(true);
    setActiveTab('Lifecycle');
    logActivity(`viewed insights for '${stage}' stage`);
    try {
        const insights = await geminiService.getLifecycleInsights(grant, stage);
        setLifecycleInsights(insights);
    } catch(e) {
        console.error(`Failed to get insights for ${stage}:`, e);
        showToast(`The AI couldn't fetch insights for the ${stage} stage. Please try again.`, 'error');
    } finally {
        setIsFetchingInsights(false);
    }
  };

  const handleSaveDraft = useCallback(async (section: string, content: string) => {
    if (!grantId) return;
    try {
      await draftService.addDraft(grantId, { section, content });
      logActivity(`saved a new draft for '${section}'`);
      setHasDrafts(true);
      setActiveTab('Drafts');
      showToast('Draft saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save draft.', 'error');
    }
  }, [grantId, logActivity, showToast]);

  const confidenceScoreStyles: Record<EligibilityReport['confidenceScore'], string> = {
    High: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-red-100 text-red-800 border-red-200',
  };

  const TabButton: React.FC<{tab: DetailTab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {icon}
      {label}
    </button>
  );
  
  const InsightCard: React.FC<{icon: React.ReactNode, title: string, children: React.ReactNode}> = ({icon, title, children}) => (
      <div>
        <h4 className="font-semibold text-gray-700 flex items-center mb-2">
            {icon}
            {title}
        </h4>
        {children}
      </div>
  );

  if (!grant || !grantId) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center sticky top-24">
        <Columns size={48} className="text-primary opacity-50 mb-4" strokeWidth={1.5}/>
        <h3 className="text-xl font-semibold text-gray-700">Select an Opportunity</h3>
        <p className="mt-2 text-gray-500">Choose a grant from the list to see more details and get help from our AI assistant.</p>
      </div>
    );
  }
  
  const getGrantIdForUrl = (g: GrantOpportunity) => `${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${btoa(g.url).slice(0, 10)}`;
  const isTeamProject = profile.owner.type === 'team';

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col animate-fade-in sticky top-24">
        <div className="p-6 border-b border-gray-200">
            <GrantLifecycleTracker currentStatus={grant.status} onStageSelect={handleStageSelect} />
            <div className="flex justify-between items-start mt-4">
              <h2 className="text-2xl font-bold text-gray-800">{grant.name}</h2>
              <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-800">&times;</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <div className="relative inline-block">
              <select
                value={grant.status}
                onChange={(e) => handleStatusChange(e.target.value as GrantStatus)}
                className="appearance-none text-sm font-semibold bg-gray-100 text-gray-800 pl-3 pr-8 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Set grant status"
              >
                {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
             <button onClick={() => setIsDocManagerOpen(true)} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary"><FolderKanban size={16} className="mr-1.5" /> Document Library</button>
             <a href={grant.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-gray-600 hover:text-primary"><Link size={16} className="mr-1.5" /> Grant Website</a>
             <ShareButton grantUrl={`/grant/${getGrantIdForUrl(grant)}`} grantName={grant.name} />
          </div>
        </div>

        <div className="flex-grow flex flex-col overflow-y-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
             <TabButton tab="Lifecycle" label="Lifecycle" icon={<Map size={16}/>} />
             {grant.status === 'Awarded' && <TabButton tab="Reporting" label="Reporting" icon={<FileBarChart2 size={16}/>} />}
             <TabButton tab="Funder Persona" label="Funder Persona" icon={<Briefcase size={16}/>} />
             <TabButton tab="Success Patterns" label="Success Patterns" icon={<Bot size={16}/>} />
             <TabButton tab="Analysis" label="Analysis" icon={<ShieldCheck size={16}/>} />
             <TabButton tab="Checklist" label="Checklist" icon={<CheckSquare size={16}/>} />
             <TabButton tab="Drafts" label="Drafts" icon={<BookText size={16}/>} />
             <TabButton tab="Budget" label="Budget" icon={<Wallet size={16}/>} />
             {hasDrafts && grant.status !== 'Awarded' && <TabButton tab="Review" label="Review" icon={<Star size={16}/>} />}
             <TabButton tab="Assistant" label="Assistant" icon={<MessageSquare size={16}/>} />
             {isTeamProject && <TabButton tab="Activity" label="Activity" icon={<History size={16}/>} />}
          </div>

          <div className="flex-grow overflow-y-auto p-6">
             {isDataLoading && !eligibilityReport ? <LoadingSpinner message="Loading grant details..."/> : (
             <>
             {activeTab === 'Lifecycle' && (
                 <div className="animate-fade-in">
                     {isFetchingInsights && <LoadingSpinner message={`AI is analyzing the ${selectedStage} stage...`}/>}
                     {lifecycleInsights && selectedStage && (
                         <div className="space-y-6 text-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">What to Expect: {selectedStage} Stage</h3>
                            <InsightCard icon={<Target size={18} className="mr-2.5 text-blue-600"/>} title="Key Activities">
                                <ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">{lifecycleInsights.keyActivities.map((activity, i) => <li key={i}>{activity}</li>)}</ul>
                            </InsightCard>
                             <InsightCard icon={<CalendarClock size={18} className="mr-2.5 text-purple-600"/>} title="Typical Timeline">
                                <p className="text-gray-700 bg-purple-50 p-3 rounded-md border border-purple-200">{lifecycleInsights.typicalTimeline}</p>
                            </InsightCard>
                             <InsightCard icon={<Star size={18} className="mr-2.5 text-yellow-600"/>} title="Insider Tips from AI">
                                <p className="text-gray-700 bg-yellow-50 p-3 rounded-md border border-yellow-200">{lifecycleInsights.insiderTips}</p>
                            </InsightCard>
                         </div>
                     )}
                     {!selectedStage && !isFetchingInsights && (<div className="text-center text-gray-500 py-8"><Map size={32} className="mx-auto mb-2 opacity-50" /><p>Select a stage from the timeline above to get AI-powered insights.</p></div>)}
                 </div>
            )}
            {activeTab === 'Reporting' && <ReportingManager grant={grant} />}
            {activeTab === 'Funder Persona' && <FunderPersonaAnalysis grant={grant} user={user} persona={funderPersona} isLoading={isDataLoading} onAnalyze={handleAnalyzeFunderPersona} error={null}/>}
            {activeTab === 'Success Patterns' && <SuccessPatternAnalysisComponent grant={grant} user={user} analysis={successPatternAnalysis} isLoading={isDataLoading} onAnalyze={handleAnalyzeSuccessPatterns} error={null}/>}
            {activeTab === 'Analysis' && (
              <div className="animate-fade-in">
                {grant.status !== 'Awarded' && (
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-700">Get a detailed report on your eligibility, key deadlines, and application advice.</p>
                            {config?.monetizationModel === 'UsageBased' && user.role !== 'Admin' && <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{usage.remaining}/{usage.limit} Free Analyses Remaining</span>}
                        </div>
                         <FeatureGuard user={user} featureName="AI Eligibility Analysis">
                            <button onClick={handleCheckEligibility} disabled={isDataLoading} className="w-full flex-shrink-0 flex items-center justify-center text-sm font-medium text-white bg-primary px-4 py-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <Sparkles size={16} className="mr-2" />{isDataLoading ? 'Analyzing...' : 'Run AI Analysis'}
                            </button>
                         </FeatureGuard>
                    </div>
                )}
                {eligibilityReport ? (
                  <div className="space-y-6 text-sm">
                     <InsightCard icon={<ShieldCheck size={18} className="mr-2.5 text-blue-600"/>} title="Confidence Score"><span className={`px-3 py-1 text-sm font-bold rounded-full border ${confidenceScoreStyles[eligibilityReport.confidenceScore]}`}>{eligibilityReport.confidenceScore} Match</span></InsightCard>
                     <InsightCard icon={<CalendarClock size={18} className="mr-2.5 text-purple-600"/>} title="Key Application Deadlines">
                      {eligibilityReport.deadlines.length > 0 ? (<ul className="space-y-2 text-gray-600">{eligibilityReport.deadlines.map((d, i) => (<li key={i} className="flex items-center justify-between"><span><strong>{d.date}:</strong> {d.description}</span><a href={createCalendarFile(`Deadline: ${d.description}`, `Grant application deadline for "${grant.name}".`, d.date)} download={`${grant.name} - Deadline.ics`} className="flex items-center text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20"><CalendarPlus size={14} className="mr-1"/> Add to Calendar</a></li>))}</ul>) : (<p className="text-gray-500 italic">The AI could not find any specific deadlines.</p>)}
                    </InsightCard>
                    <InsightCard icon={<ThumbsUp size={18} className="mr-2.5 text-green-600"/>} title="Key Strengths"><ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">{eligibilityReport.strengths.map((item, i) => <li key={i}>{item}</li>)}</ul></InsightCard>
                    <InsightCard icon={<AlertTriangle size={18} className="mr-2.5 text-yellow-600"/>} title="Potential Gaps to Address"><ul className="list-disc list-inside space-y-1 text-gray-600 pl-2">{eligibilityReport.gaps.map((item, i) => <li key={i}>{item}</li>)}</ul></InsightCard>
                    <InsightCard icon={<Lightbulb size={18} className="mr-2.5 text-indigo-600"/>} title="Actionable Advice"><p className="text-gray-700 bg-indigo-50 p-3 rounded-md border border-indigo-200">{eligibilityReport.advice}</p></InsightCard>
                  </div>
                ) : !isDataLoading && (<div className="text-center text-gray-500 py-8"><p>Click "Run AI Analysis" to get started.</p></div>)}
                 {sources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-base font-semibold text-gray-700 mb-3 flex items-center"><Info size={20} className="mr-2 text-gray-500" /> Sources Consulted</h3>
                    <ul className="space-y-2">{sources.map((s, i) => (<li key={i} className="flex items-center gap-2 text-sm text-gray-600"><Link size={14} className="text-gray-400 flex-shrink-0" /><a href={s.web.uri} target="_blank" rel="noopener noreferrer" className="truncate hover:underline hover:text-primary" title={s.web.title || s.web.uri}>{s.web.title || s.web.uri}</a></li>))}</ul>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'Checklist' && <Checklist grantId={grantId} profile={profile} />}
            {activeTab === 'Drafts' && <DraftsManager grantId={grantId} profile={profile} user={user} onDraftUpdate={loadGrantData} />}
            {activeTab === 'Budget' && <BudgetAssistant grantId={grantId} profile={profile} />}
            {activeTab === 'Review' && <ApplicationReviewer grant={grant} grantId={grantId} profile={profile} user={user} />}
            {activeTab === 'Assistant' && <ChatAssistant user={user} grant={grant} profile={profile} onSaveDraft={handleSaveDraft} />}
            {activeTab === 'Activity' && <ActivityFeed activityLog={activityLog} />}
            </>
            )}
          </div>
        </div>
      </div>
      <Modal isOpen={isDocManagerOpen} onClose={() => setIsDocManagerOpen(false)} title={`Document Library for "${profile.name}"`}>
        <DocumentManager profile={profile} />
      </Modal>
    </>
  );
};

export default GrantDetailView;
