import { FundingProfile, GrantOpportunity, ChatMessage, EligibilityReport, LifecycleStage, LifecycleInsights, GrantDraft, ApplicationReview, RedTeamReview, BudgetItem, FunderPersona, SuccessPatternAnalysis, DifferentiationAnalysis, CohesionAnalysis, Team, FundingTrendReport, SemanticSearchResult, LessonsLearnedReport } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api/ai';

const getAuthHeaders = () => {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const aiApiCall = async (endpoint: string, body: object): Promise<any> => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
        throw new Error(errorData.message || 'AI service request failed.');
    }
    return response.json();
};


export const findGrants = async (profile: FundingProfile): Promise<{ opportunities: GrantOpportunity[], sources: any[] }> => {
  return aiApiCall('/find-grants', { profile });
};

export const checkEligibility = async (profile: FundingProfile, grant: GrantOpportunity): Promise<EligibilityReport> => {
  return aiApiCall('/check-eligibility', { profile, grant });
};

export const getLifecycleInsights = async (grant: GrantOpportunity, stage: LifecycleStage): Promise<LifecycleInsights> => {
  return aiApiCall('/lifecycle-insights', { grant, stage });
};

export const analyzeFunderPersona = async (grant: GrantOpportunity): Promise<FunderPersona> => {
  return aiApiCall('/funder-persona', { grant });
};

export const analyzeSuccessPatterns = async (grant: GrantOpportunity): Promise<SuccessPatternAnalysis> => {
  return aiApiCall('/success-patterns', { grant });
};

export const analyzeDifferentiation = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<DifferentiationAnalysis> => {
  return aiApiCall('/differentiation', { grant, drafts });
};

export const analyzeProposalCohesion = async (grant: GrantOpportunity, drafts: GrantDraft[], budgetItems: BudgetItem[]): Promise<CohesionAnalysis> => {
    return aiApiCall('/cohesion', { grant, drafts, budgetItems });
};

export const draftGrantSection = async (profile: FundingProfile, grant: GrantOpportunity, section: string, teamId?: number): Promise<string> => {
    const { content } = await aiApiCall('/draft-section', { profile, grant, section, teamId });
    return content;
};

export const reviewApplication = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<ApplicationReview> => {
  return aiApiCall('/review-application', { grant, drafts });
};

export const runRedTeamReview = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<RedTeamReview> => {
  return aiApiCall('/red-team-review', { grant, drafts });
};

export const generateBudgetJustification = async (grant: GrantOpportunity, drafts: GrantDraft[], budgetItem: Pick<BudgetItem, 'description' | 'amount'>): Promise<string> => {
    const { justification } = await aiApiCall('/budget-justification', { grant, drafts, budgetItem });
    return justification;
};

export const draftGrantReport = async (profile: FundingProfile, grant: GrantOpportunity, progressNotes: string): Promise<string> => {
    const { report } = await aiApiCall('/draft-report', { profile, grant, progressNotes });
    return report;
};

// The chat is now stateless. We send the history with each message.
export const sendMessageToChat = async (profile: FundingProfile, grant: GrantOpportunity, messages: ChatMessage[], newMessage: string): Promise<string> => {
    const { reply } = await aiApiCall('/chat', { profile, grant, messages, newMessage });
    return reply;
};

export const extractComplianceTasks = async (grantAgreementText: string): Promise<{tasks: {description: string, dueDate: string}[]}> => {
  return aiApiCall('/extract-compliance', { grantAgreementText });
};

export const generateImpactStory = async (dataPoints: string): Promise<string> => {
  const { story } = await aiApiCall('/impact-story', { dataPoints });
  return story;
};

export const analyzeFundingTrends = async (sector: string): Promise<FundingTrendReport> => {
  return aiApiCall('/funding-trends', { sector });
};

export const searchKnowledgeBase = async (query: string, teamId: number): Promise<SemanticSearchResult> => {
  return aiApiCall('/kb-search', { query, teamId });
};

export const generateLessonsLearned = async (teamId: number): Promise<LessonsLearnedReport> => {
  return aiApiCall('/lessons-learned', { teamId });
};