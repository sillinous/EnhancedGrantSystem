// Replaces geminiService.ts — all AI calls now go to /api/ai/* Netlify functions
import { FundingProfile, GrantOpportunity, ChatMessage, EligibilityReport, LifecycleStage, LifecycleInsights, GrantDraft, ApplicationReview, RedTeamReview, BudgetItem, FunderPersona, SuccessPatternAnalysis, DifferentiationAnalysis, CohesionAnalysis } from '../types';

const post = async (action: string, body: object) => {
  const res = await fetch(`/api/ai/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`AI service error: ${res.status}`);
  return res.json();
};

export const findGrants = async (profile: FundingProfile) =>
  post('find-grants', { profile });

export const checkEligibility = async (profile: FundingProfile, grant: GrantOpportunity): Promise<EligibilityReport> =>
  post('check-eligibility', { profile, grant });

export const getLifecycleInsights = async (grant: GrantOpportunity, stage: LifecycleStage): Promise<LifecycleInsights> =>
  post('lifecycle-insights', { grant, stage });

export const draftGrantSection = async (profile: FundingProfile, grant: GrantOpportunity, section: string): Promise<string> => {
  const d = await post('draft-section', { profile, grant, section });
  return d.draft || '';
};

export const reviewApplication = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<ApplicationReview> =>
  post('review-application', { grant, drafts });

export const runRedTeamReview = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<RedTeamReview> =>
  post('red-team-review', { grant, drafts });

export const generateBudgetJustification = async (grant: GrantOpportunity, drafts: GrantDraft[], budgetItem: Pick<BudgetItem, 'description' | 'amount'>): Promise<string> => {
  const d = await post('budget-justification', { grant, drafts, budgetItem });
  return d.justification || '';
};

export const analyzeFunderPersona = async (grant: GrantOpportunity): Promise<FunderPersona> =>
  post('funder-persona', { grant });

export const analyzeSuccessPatterns = async (grant: GrantOpportunity): Promise<SuccessPatternAnalysis> =>
  post('success-patterns', { grant });

export const analyzeDifferentiation = async (grant: GrantOpportunity, drafts: GrantDraft[]): Promise<DifferentiationAnalysis> =>
  post('differentiation', { grant, drafts });

export const analyzeProposalCohesion = async (grant: GrantOpportunity, drafts: GrantDraft[], budgetItems: BudgetItem[]): Promise<CohesionAnalysis> =>
  post('cohesion-analysis', { grant, drafts, budgetItems });

export const sendMessageToChat = async (profile: FundingProfile, grant: GrantOpportunity, messages: ChatMessage[], newMessage: string): Promise<string> => {
  const d = await post('chat', { profile, grant, messages, newMessage });
  return d.reply || '';
};

export const generateImpactStory = async (dataPoints: string): Promise<string> => {
  const d = await post('impact-story', { dataPoints });
  return d.story || '';
};

export const draftGrantReport = async (profile: FundingProfile, grant: GrantOpportunity, progressNotes: string): Promise<string> => {
  const d = await post('draft-report', { profile, grant, progressNotes });
  return d.report || '';
};

export const extractComplianceTasks = async (grantAgreementText: string) =>
  post('extract-compliance', { text: grantAgreementText });
