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
  id: string;
  name: string;
  sector: string;
  status: 'Active' | 'Idle';
}

// --- New Types for Monetization and User Roles ---

export type Role = 'User' | 'Admin';
export type TeamRole = 'Admin' | 'Editor' | 'Viewer';

export interface User {
  id: number;
  username: string;
  role: Role;
  isSubscribed: boolean; // For subscription model
  teamIds: number[];
}

export type MonetizationModel = 'Free' | 'Subscription' | 'PayPerFeature' | 'UsageBased';

export interface AppConfig {
  monetizationModel: MonetizationModel;
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
