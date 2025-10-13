export interface FundingProfile {
  id: number;
  profileType: 'Individual' | 'Business' | 'Non-Profit';
  name: string;
  industry: string;
  stage: 'Idea' | 'Startup' | 'Growth' | 'Established';
  description: string;
  fundingNeeds: string;
  owner: { type: 'user'; id: number } | { type: 'team'; id: number };
}

export interface GrantOpportunity {
  name: string;
  description: string;
  fundingAmount: string;
  url: string;
  industry: string;
  deadline: string;
}

export interface PublicGrant extends GrantOpportunity {
  id: string;
  funder: string;
  eligibility: string;
}

export type GrantStatus = 'Interested' | 'Applying' | 'Submitted' | 'Awarded' | 'Rejected';
export type LifecycleStage = 'Discovery' | 'Application' | 'Submission & Review' | 'Award' | 'Reporting';


export interface GroundingSource {
  web: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  type?: 'draft' | 'prompt';
  draftContent?: {
    section: string;
    content: string;
  };
  isSaved?: boolean;
}

export interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
  dueDate?: string;
  documentId?: number;
  documentName?: string;
}

export interface Document {
  id: number;
  profileId: number;
  name: string;
  category: string;
}

export interface EligibilityReport {
  confidenceScore: 'High' | 'Medium' | 'Low';
  deadlines: { date: string; description: string }[];
  strengths: string[];
  gaps: string[];
  advice: string;
}

export interface GrantDraft {
  id: number;
  grantId: string;
  section: string;
  content: string;
  createdAt: string;
  status: 'Draft' | 'Pending Approval' | 'Approved';
  comments: Comment[];
  lockedBy?: { userId: number; username: string };
}

export interface ReportingRequirement {
    id: number;
    grantId: string;
    description: string;
    dueDate: string;
    completed: boolean;
}

export interface Expense {
    id: number;
    grantId: string;
    description: string;
    amount: number;
    date: string;
    budgetItemId?: number;
    category?: string;
}

export interface BudgetItem {
  id: number;
  grantId: string;
  description: string;
  amount: number;
  justification: string;
}

export interface LifecycleInsights {
  keyActivities: string[];
  typicalTimeline: string;
  insiderTips: string;
}

export interface ApplicationReview {
  overallScore: 'Strong Contender' | 'Promising' | 'Needs Revision';
  strengths: string[];
  recommendations: string[];
  generatedAt: string;
}

export interface RedTeamReview {
  overallRisk: 'High' | 'Medium' | 'Low';
  vulnerabilities: string[];
  probingQuestions: string[];
  generatedAt: string;
}

export interface FunderPersona {
    funderName: string;
    coreMission: string;
    keyPriorities: string[];
    communicationStyle: string;
    strategicAdvice: string;
    generatedAt: string;
}

export interface SuccessPatternAnalysis {
    commonThemes: string[];
    fundedProjectTypes: string[];
    fundingRangeInsights: string;
    keywordPatterns: string[];
    strategicRecommendations: string;
    generatedAt: string;
}

export interface DifferentiationAnalysis {
  innovativeAngles: string[];
  alternativeMetrics: string[];
  partnershipSuggestions: string[];
  generatedAt: string;
}

export interface CohesionFinding {
  finding: string;
  sections: string[];
  severity: 'Critical' | 'Warning' | 'Suggestion';
}

export interface CohesionAnalysis {
  findings: CohesionFinding[];
  generatedAt: string;
}

export interface ExtractedComplianceTask {
  description: string;
  dueDate: string;
}

export interface ImpactStory {
  userInput: string;
  generatedStory: string;
  createdAt: string;
}

export interface SourcingAgent {
  id: number;
  profileId: number;
  name: string;
  sector: string;
  status: 'Active' | 'Idle';
}

// --- Enterprise & Monetization Types ---

export type Role = 'User' | 'Admin';
export type TeamRole = 'Admin' | 'Editor' | 'Viewer' | 'Approver' | 'Stakeholder' | 'Partner';

export interface User {
  id: number;
  username: string;
  role: Role;
  isSubscribed: boolean;
  teamIds: number[];
}

export type MonetizationModel = 'Free' | 'Subscription' | 'PayPerFeature' | 'UsageBased';
export type SSOProvider = 'Google' | 'Okta' | 'Azure AD' | 'GitHub' | 'Facebook';

export interface AppConfig {
  monetizationModel: MonetizationModel;
  enabledSSOProviders: SSOProvider[];
}

export interface Subscription {
  userId: number;
  plan: 'Free' | 'Pro';
  status: 'active' | 'canceled';
  currentPeriodEnd: number; // timestamp
}

export interface TeamMember {
    userId: number;
    role: TeamRole;
}

export interface Team {
    id: number;
    name: string;
    members: TeamMember[];
    customRoles?: CustomRole[];
    ssoConfig?: {
      provider: SSOProvider;
      domain: string;
    };
    branding?: BrandingSettings;
}

export interface BrandingSettings {
    primaryColor: string;
    logoUrl: string;
}

export interface BoilerplateDocument {
    id: number;
    teamId: number;
    title: string;
    content: string;
}

export interface ActivityLog {
    id: number;
    timestamp: string;
    username: string;
    userId: number;
    action: string;
}

export interface SuperAdminStats {
    totalUsers: number;
    activeSubscriptions: number;
    totalTeams: number;
}

export interface Comment {
    id: number;
    userId: number;
    username: string;
    timestamp: string;
    content: string;
}

export interface Permissions {
    canEditProfiles: boolean;
    canManageDrafts: boolean;
    canApproveDrafts: boolean;
    canManageTeam: boolean;
}

export interface CustomRole {
    id: number;
    name: string;
    permissions: Permissions;
    isDefault: boolean;
}

export interface GrantSection {
    section: string;
    content: string;
}

export interface FullProposal {
    title: string;
    sections: GrantSection[];
    generatedAt: string;
}

export interface KnowledgeBaseDocument {
    id: number;
    teamId: number;
    name: string;
    content: string;
    outcome: 'Won' | 'Lost' | 'Informational';
    uploadedAt: string;
}

export interface SemanticSearchResult {
    answer: string;
    sources: { documentId: number; documentName: string; }[];
}

export interface LessonsLearnedFinding {
    theme: string;
    suggestion: string;
    supportingExcerpts: string[];
}

export interface LessonsLearnedReport {
    summary: string;
    findings: LessonsLearnedFinding[];
    generatedAt: string;
}

export interface FundingTrendReport {
    sector: string;
    summary: string;
    emergingKeywords: string[];
    shiftingPriorities: string[];
    newAreasOfFocus: string[];
    generatedAt: string;
}

export interface HeatmapData {
    sector: string;
    region: string;
    fundingVolume: number;
}

export interface ForecastedGrant {
    name: string;
    funder: string;
    estimatedReopening: string; // e.g., "Q4 2024"
    confidence: 'High' | 'Medium' | 'Low';
}

export interface PipelineStats {
    totalPipeline: number;
    totalAwardedYTD: number;
    successRate: number;
}

// --- UI Specific Types ---
export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  icon?: React.ReactNode;
}

export interface Notification {
  id: number;
  message: string;
  grantName: string;
  grantUrl: string;
  isRead: boolean;
  createdAt: string;
}