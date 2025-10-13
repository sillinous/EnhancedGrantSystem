import React, { useState, useEffect } from 'react';
import { User, FundingTrendReport, SemanticSearchResult, LessonsLearnedReport, ForecastedGrant, Team } from '../types';
import Header from './Header';
import FeatureGuard from './FeatureGuard';
import LoadingSpinner from './LoadingSpinner';
import * as geminiService from '../services/geminiService';
import * as teamService from '../services/teamService';
import * as knowledgeBaseService from '../services/knowledgeBaseService';
import { useToast } from '../hooks/useToast';
import { BarChart3, Search, BrainCircuit, Bot, TrendingUp, BookCopy, FileClock, Users } from 'lucide-react';

const mockForecastedGrants: ForecastedGrant[] = [
    { name: 'Future Tech Initiative', funder: 'Innovate Foundation', estimatedReopening: 'Q1 2025', confidence: 'High' },
    { name: 'Arts for All Fund', funder: 'Creative Communities Alliance', estimatedReopening: 'Q4 2024', confidence: 'Medium' },
];

const IntelligencePlatform: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('trends');
    const [userTeams, setUserTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const { showToast } = useToast();
    
    // State for Funding Trends
    const [trendSector, setTrendSector] = useState('Renewable Energy');
    const [trendReport, setTrendReport] = useState<FundingTrendReport | null>(null);
    const [isTrendLoading, setIsTrendLoading] = useState(false);

    // State for Knowledge Base Search
    const [kbQuery, setKbQuery] = useState('');
    const [kbResult, setKbResult] = useState<SemanticSearchResult | null>(null);
    const [isKbLoading, setIsKbLoading] = useState(false);
    
    // State for Lessons Learned
    const [lessonsLearnedReport, setLessonsLearnedReport] = useState<LessonsLearnedReport | null>(null);
    const [isLessonsLoading, setIsLessonsLoading] = useState(false);
    
    useEffect(() => {
        const fetchTeams = async () => {
            const teams = await teamService.getTeamsForUser(user.id);
            setUserTeams(teams);
            if (teams.length > 0) {
                setSelectedTeamId(teams[0].id);
            }
        };
        fetchTeams();
    }, [user.id]);

    const handleAnalyzeTrends = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsTrendLoading(true);
        setTrendReport(null);
        try {
            const report = await geminiService.analyzeFundingTrends(trendSector);
            setTrendReport(report);
        } catch (err) {
            showToast('AI failed to generate trend report. Please try again.', 'error');
        } finally {
            setIsTrendLoading(false);
        }
    };

    const handleKbSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeamId) {
            showToast("Please select a team to search their knowledge base.", 'error');
            return;
        }
        setIsKbLoading(true);
        setKbResult(null);
        try {
            const result = await geminiService.searchKnowledgeBase(kbQuery, selectedTeamId);
            setKbResult(result);
        } catch (err) {
            showToast('AI failed to search the knowledge base. Please try again.', 'error');
        } finally {
            setIsKbLoading(false);
        }
    };
    
    const handleGenerateLessons = async () => {
        if (!selectedTeamId) {
           showToast("Please select a team to generate a report.", 'error');
           return;
       }
        setIsLessonsLoading(true);
        setLessonsLearnedReport(null);
        try {
            const report = await geminiService.generateLessonsLearned(selectedTeamId);
            setLessonsLearnedReport(report);
        } catch (err) {
            const error = err as Error;
            showToast(error.message || 'AI failed to generate the report.', 'error');
        } finally {
            setIsLessonsLoading(false);
        }
    };
    
    const KnowledgeBaseGuard: React.FC<{children: React.ReactNode}> = ({children}) => {
        const [hasDocs, setHasDocs] = useState(true);
        const [isLoading, setIsLoading] = useState(true);

        useEffect(() => {
            const checkDocs = async () => {
                if(selectedTeamId) {
                    const docs = await knowledgeBaseService.getKnowledgeBaseDocuments(selectedTeamId);
                    setHasDocs(docs.length > 0);
                } else {
                    setHasDocs(false);
                }
                setIsLoading(false);
            };
            checkDocs();
        }, [selectedTeamId]);

        if(isLoading) return <LoadingSpinner />;
        if(!selectedTeamId) {
            return (
                <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                    <Users size={32} className="mx-auto mb-2" />
                    <p>You must be part of a team to use these features.</p>
                </div>
            )
        }
        if (!hasDocs) {
            return (
                 <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                    <BookCopy size={32} className="mx-auto mb-2" />
                    <p>This team's knowledge base is empty.</p>
                    <p className="text-xs mt-1">An Admin must add past grant documents in the <a href={`/team-hub/${selectedTeamId}`} className="text-primary underline">Team Hub</a> to enable this feature.</p>
                </div>
            );
        }
        return <>{children}</>;
    };

    const TabButton = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            {icon} {label}
        </button>
    );

    const Card: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="flex items-center text-primary mb-4">
                {icon}
                <h3 className="text-xl font-bold ml-3">{title}</h3>
            </div>
            <div className="flex-grow">{children}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={onLogout} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Intelligence Platform</h1>
                    <p className="text-gray-600 mt-1">AI-powered insights to elevate your grant strategy.</p>
                </div>

                <FeatureGuard user={user} featureName="Intelligence Platform">
                    <div className="flex items-center justify-between border-b mb-6 gap-2">
                        <div className="flex gap-2">
                            <TabButton id="trends" label="Market Intelligence" icon={<BarChart3 size={16} />} />
                            <TabButton id="kb" label="Knowledge Base Q&A" icon={<Search size={16} />} />
                            <TabButton id="lessons" label="Performance Analytics" icon={<BrainCircuit size={16} />} />
                            <TabButton id="forecast" label="Forecasting" icon={<TrendingUp size={16} />} />
                        </div>
                        {(activeTab === 'kb' || activeTab === 'lessons') && userTeams.length > 1 && (
                            <select value={selectedTeamId || ''} onChange={e => setSelectedTeamId(Number(e.target.value))} className="text-sm p-1 border rounded-md">
                                {userTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="animate-fade-in">
                        {activeTab === 'trends' && (
                            <Card title="Funding Trend Analysis" icon={<BarChart3 size={24} />}>
                                <form onSubmit={handleAnalyzeTrends} className="flex gap-2 mb-4">
                                    <input type="text" value={trendSector} onChange={e => setTrendSector(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Enter a sector, e.g., 'Healthcare'" />
                                    <button type="submit" disabled={isTrendLoading} className="px-4 py-2 bg-primary text-white rounded-lg disabled:bg-gray-400">Analyze</button>
                                </form>
                                {isTrendLoading && <LoadingSpinner message="Analyzing sector trends..." />}
                                {trendReport && (
                                    <div className="space-y-4 text-sm">
                                        <p><strong>Summary:</strong> {trendReport.summary}</p>
                                        <div><strong>Emerging Keywords:</strong> <div className="flex flex-wrap gap-1 mt-1">{trendReport.emergingKeywords.map(k => <span key={k} className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">{k}</span>)}</div></div>
                                        <p><strong>Shifting Priorities:</strong> {trendReport.shiftingPriorities.join(', ')}</p>
                                        <p><strong>New Areas of Focus:</strong> {trendReport.newAreasOfFocus.join(', ')}</p>
                                        <p className="text-xs text-gray-400 text-right">Generated: {new Date(trendReport.generatedAt).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </Card>
                        )}
                        
                        {activeTab === 'kb' && (
                             <Card title="Knowledge Base Q&A" icon={<Search size={24} />}>
                                 <KnowledgeBaseGuard>
                                     <form onSubmit={handleKbSearch} className="flex gap-2 mb-4">
                                        <input type="text" value={kbQuery} onChange={e => setKbQuery(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ask about past proposals, feedback, etc." />
                                        <button type="submit" disabled={isKbLoading} className="px-4 py-2 bg-primary text-white rounded-lg disabled:bg-gray-400">Ask AI</button>
                                    </form>
                                    {isKbLoading && <LoadingSpinner message="Searching knowledge base..." />}
                                    {kbResult && (
                                        <div className="space-y-4 text-sm bg-gray-50 p-4 rounded-lg">
                                            <p className="font-semibold text-gray-800">{kbResult.answer}</p>
                                            {kbResult.sources.length > 0 && <div>
                                                <h4 className="font-bold">Sources:</h4>
                                                <ul className="list-disc list-inside">
                                                    {kbResult.sources.map(s => <li key={s.documentId}>{s.documentName}</li>)}
                                                </ul>
                                            </div>}
                                        </div>
                                    )}
                                 </KnowledgeBaseGuard>
                             </Card>
                        )}

                        {activeTab === 'lessons' && (
                            <Card title="Lessons Learned Report" icon={<BrainCircuit size={24} />}>
                                <KnowledgeBaseGuard>
                                    {!lessonsLearnedReport && !isLessonsLoading && (
                                        <div className="text-center">
                                            <p className="mb-4">Analyze your team's past grant outcomes to identify actionable insights for future success.</p>
                                            <button onClick={handleGenerateLessons} className="px-4 py-2 bg-primary text-white rounded-lg">Generate Report</button>
                                        </div>
                                    )}
                                    {isLessonsLoading && <LoadingSpinner message="Analyzing past outcomes..." />}
                                    {lessonsLearnedReport && (
                                        <div className="space-y-4 text-sm">
                                            <p><strong>Summary:</strong> {lessonsLearnedReport.summary}</p>
                                            {lessonsLearnedReport.findings.map((finding, i) => (
                                                <div key={i} className="border-t pt-2">
                                                    <p><strong>Theme:</strong> {finding.theme}</p>
                                                    <p><strong>Suggestion:</strong> {finding.suggestion}</p>
                                                </div>
                                            ))}
                                            <p className="text-xs text-gray-400 text-right">Generated: {new Date(lessonsLearnedReport.generatedAt).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </KnowledgeBaseGuard>
                            </Card>
                        )}
                        
                         {activeTab === 'forecast' && (
                             <Card title="Forecasted Opportunities" icon={<TrendingUp size={24} />}>
                                 <p className="text-sm text-gray-500 mb-4">AI-powered predictions for grants likely to reopen based on historical data.</p>
                                 <ul className="space-y-2">
                                     {mockForecastedGrants.map(grant => (
                                         <li key={grant.name} className="p-3 bg-gray-50 border rounded-lg">
                                             <p className="font-semibold">{grant.name}</p>
                                             <div className="text-xs flex justify-between items-center mt-1">
                                                 <span>{grant.funder}</span>
                                                 <span className="font-bold">{grant.estimatedReopening} (Confidence: {grant.confidence})</span>
                                             </div>
                                         </li>
                                     ))}
                                 </ul>
                             </Card>
                         )}
                    </div>
                </FeatureGuard>
            </main>
        </div>
    );
};

export default IntelligencePlatform;