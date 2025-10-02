import fs from 'fs';
import path from 'path';
import { User, Team, FundingProfile, GrantOpportunity, GrantStatus, ChecklistItem, GrantDraft, BudgetItem, Expense, ReportingRequirement, Document, ApplicationReview, RedTeamReview, FunderPersona, SuccessPatternAnalysis, DifferentiationAnalysis, CohesionAnalysis, ActivityLog, AppConfig, Subscription, BoilerplateDocument, KnowledgeBaseDocument, SourcingAgent, Notification } from '../types';

const dbPath = path.join(__dirname, 'db.json');

// FIX: The `Database` interface was not exported, making it unavailable for import in other modules.
export interface Database {
  users: User[];
  teams: Team[];
  profiles: FundingProfile[];
  trackedGrants: GrantOpportunity[];
  grantStatuses: Record<string, GrantStatus>;
  grantOwners: Record<string, number>;
  checklists: Record<string, ChecklistItem[]>;
  drafts: Record<string, GrantDraft[]>;
  budgetItems: Record<string, BudgetItem[]>;
  expenses: Record<string, Expense[]>;
  reportingRequirements: Record<string, ReportingRequirement[]>;
  documents: Record<number, Document[]>;
  reviews: Record<string, ApplicationReview>;
  redTeamReviews: Record<string, RedTeamReview>;
  personas: Record<string, FunderPersona>;
  successPatterns: Record<string, SuccessPatternAnalysis>;
  differentiationAnalyses: Record<string, DifferentiationAnalysis>;
  cohesionAnalyses: Record<string, CohesionAnalysis>;
  activityLogs: Record<string, ActivityLog[]>;
  appConfig: AppConfig;
  subscriptions: Record<string, Subscription>;
  boilerplates: Record<string, BoilerplateDocument[]>;
  knowledgeBase: Record<string, KnowledgeBaseDocument[]>;
  sourcingAgents: SourcingAgent[];
  notifications: Notification[];
  feedback: any[];
}

const defaultUsers: User[] = [
  { id: 1, username: 'user@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
  { id: 2, username: 'pro_user@example.com', role: 'User', isSubscribed: true, teamIds: [101, 102] },
  { id: 3, username: 'admin@example.com', role: 'Admin', isSubscribed: true, teamIds: [] },
  { id: 4, username: 'teammate@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
];

const defaultTeams: Team[] = [
    { 
      id: 101, 
      name: 'EcoInnovate Foundation', 
      members: [ { userId: 1, role: 'Editor' }, { userId: 2, role: 'Admin' }, { userId: 4, role: 'Viewer' } ],
      branding: { primaryColor: '#16a34a', logoUrl: 'https://placehold.co/150x50/16a34a/FFFFFF/png?text=EcoInnovate' }
    },
    { id: 102, name: 'Pro User\'s Side Project', members: [{ userId: 2, role: 'Admin' }] },
];

const defaultProfiles: FundingProfile[] = [
    {
        id: 1001, name: 'EcoInnovate Foundation', profileType: 'Non-Profit', industry: 'Environmental Conservation', stage: 'Established',
        description: 'A non-profit dedicated to funding and supporting projects that address climate change through technological innovation and community action.',
        fundingNeeds: 'Operational costs, project scaling, research grants for partners', owner: { type: 'team', id: 101 }
    },
    {
        id: 1, name: 'Personal Art Project', profileType: 'Individual', industry: 'Digital Art & Media', stage: 'Idea',
        description: 'A personal project to create a series of interactive digital sculptures exploring the intersection of nature and technology.',
        fundingNeeds: 'Hardware (VR headset, high-spec PC), software licenses, marketing budget', owner: { type: 'user', id: 1 }
    }
];

const defaultKnowledgeBase: Record<string, KnowledgeBaseDocument[]> = {
    "101": [
        { id: 1, teamId: 101, name: 'EcoInnovate Climate Grant 2023 Application', content: 'Our project focuses on carbon capture...', outcome: 'Won', uploadedAt: '2023-09-15T10:00:00Z' },
        { id: 2, teamId: 101, name: 'Water Conservation Proposal 2023', content: 'This was a proposal for a new water filtration system...', outcome: 'Lost', uploadedAt: '2023-10-02T14:30:00Z' },
    ]
};


const defaultDb: Database = {
  users: defaultUsers,
  teams: defaultTeams,
  profiles: defaultProfiles,
  trackedGrants: [],
  grantStatuses: {},
  grantOwners: {},
  checklists: {},
  drafts: {},
  budgetItems: {},
  expenses: {},
  reportingRequirements: {},
  documents: {},
  reviews: {},
  redTeamReviews: {},
  personas: {},
  successPatterns: {},
  differentiationAnalyses: {},
  cohesionAnalyses: {},
  activityLogs: {},
  appConfig: { monetizationModel: 'Subscription', enabledSSOProviders: [] },
  subscriptions: {},
  boilerplates: {},
  knowledgeBase: defaultKnowledgeBase,
  sourcingAgents: [],
  notifications: [],
  feedback: [],
};

let db: Database;

export const readDb = (): Database => {
  if (db) return db;
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      return db;
    } else {
      fs.writeFileSync(dbPath, JSON.stringify(defaultDb, null, 2));
      db = defaultDb;
      return db;
    }
  } catch (error) {
    console.error('Error reading or initializing database:', error);
    return defaultDb;
  }
};

export const writeDb = (newDb: Database): void => {
  db = newDb;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error writing to database:', error);
  }
};
