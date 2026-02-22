// Central localStorage store — replaces Express backend data layer
// All data is persisted locally. No server auth required.

const NS = 'gos_'; // namespace prefix

function get<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(NS + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function set(key: string, value: unknown) {
  try { localStorage.setItem(NS + key, JSON.stringify(value)); } catch {}
}
function del(key: string) { try { localStorage.removeItem(NS + key); } catch {} }

let _nid = get<number>('nid', 1);
export function nextId(): number { _nid++; set('nid', _nid); return _nid; }

// ── PROFILES ──────────────────────────────────────────────────────────────────
import { FundingProfile } from '../types';
export const getProfiles = (): FundingProfile[] => get('profiles', []);
export const saveProfiles = (p: FundingProfile[]) => set('profiles', p);
export const addProfile = (p: Omit<FundingProfile, 'id' | 'owner'>): FundingProfile => {
  const newP: FundingProfile = { ...p, id: nextId(), owner: { type: 'user', id: 1 } };
  saveProfiles([...getProfiles(), newP]); return newP;
};
export const updateProfile = (p: FundingProfile) => { saveProfiles(getProfiles().map(x => x.id === p.id ? p : x)); return p; };
export const deleteProfile = (id: number) => saveProfiles(getProfiles().filter(x => x.id !== id));

// ── TRACKED GRANTS ────────────────────────────────────────────────────────────
import { GrantOpportunity } from '../types';
export const getTrackedGrants = (): GrantOpportunity[] => get('grants', []);
export const addTrackedGrant = (g: GrantOpportunity) => { set('grants', [...getTrackedGrants(), g]); return g; };
export const removeTrackedGrant = (id: string) => set('grants', getTrackedGrants().filter((g: any) => `${g.name}_${g.url}`.replace(/[^a-zA-Z0-9]/g,'') !== id));

// ── GRANT STATUS ──────────────────────────────────────────────────────────────
import { GrantStatus } from '../types';
export const getAllGrantStatuses = (): Record<string, GrantStatus> => get('statuses', {});
export const saveGrantStatus = (id: string, status: GrantStatus) => { const s = getAllGrantStatuses(); s[id] = status; set('statuses', s); };

// ── CHECKLIST ─────────────────────────────────────────────────────────────────
import { ChecklistItem } from '../types';
export const getChecklist = (grantId: string): ChecklistItem[] => get(`cl_${grantId}`, []);
export const addChecklistItem = (grantId: string, item: { text: string; dueDate?: string }): ChecklistItem => {
  const newItem: ChecklistItem = { id: nextId(), text: item.text, completed: false, dueDate: item.dueDate };
  set(`cl_${grantId}`, [...getChecklist(grantId), newItem]); return newItem;
};
export const updateChecklistItem = (grantId: string, itemId: number, patch: Partial<ChecklistItem>) => {
  set(`cl_${grantId}`, getChecklist(grantId).map(i => i.id === itemId ? { ...i, ...patch } : i));
};
export const deleteChecklistItem = (grantId: string, itemId: number) => {
  set(`cl_${grantId}`, getChecklist(grantId).filter(i => i.id !== itemId));
};

// ── DRAFTS ────────────────────────────────────────────────────────────────────
import { GrantDraft } from '../types';
export const getDrafts = (grantId: string): GrantDraft[] => get(`drafts_${grantId}`, []);
export const addDraft = (grantId: string, data: { section: string; content: string }): GrantDraft => {
  const d: GrantDraft = { id: nextId(), grantId, section: data.section, content: data.content, createdAt: new Date().toISOString(), status: 'Draft', comments: [] };
  const existing = getDrafts(grantId).filter(x => x.section !== data.section);
  set(`drafts_${grantId}`, [...existing, d]); return d;
};
export const updateDraft = (grantId: string, draftId: number, patch: Partial<GrantDraft>) => {
  set(`drafts_${grantId}`, getDrafts(grantId).map(d => d.id === draftId ? { ...d, ...patch } : d));
};
export const deleteDraft = (grantId: string, draftId: number) => {
  set(`drafts_${grantId}`, getDrafts(grantId).filter(d => d.id !== draftId));
};

// ── BUDGET ────────────────────────────────────────────────────────────────────
import { BudgetItem } from '../types';
export const getBudgetItems = (grantId: string): BudgetItem[] => get(`budget_${grantId}`, []);
export const addBudgetItem = (grantId: string, item: { description: string; amount: number }): BudgetItem => {
  const b: BudgetItem = { id: nextId(), grantId, description: item.description, amount: item.amount, justification: '' };
  set(`budget_${grantId}`, [...getBudgetItems(grantId), b]); return b;
};
export const updateBudgetItem = (grantId: string, itemId: number, patch: Partial<BudgetItem>) => {
  set(`budget_${grantId}`, getBudgetItems(grantId).map(i => i.id === itemId ? { ...i, ...patch } : i));
};
export const deleteBudgetItem = (grantId: string, itemId: number) => {
  set(`budget_${grantId}`, getBudgetItems(grantId).filter(i => i.id !== itemId));
};

// ── REPORTING ─────────────────────────────────────────────────────────────────
import { ReportingRequirement } from '../types';
export const getReportingRequirements = (grantId: string): ReportingRequirement[] => get(`reporting_${grantId}`, []);
export const addReportingRequirement = (grantId: string, r: Omit<ReportingRequirement, 'id'>): ReportingRequirement => {
  const req: ReportingRequirement = { id: nextId(), ...r };
  set(`reporting_${grantId}`, [...getReportingRequirements(grantId), req]); return req;
};
export const updateReportingRequirement = (grantId: string, id: number, patch: Partial<ReportingRequirement>) => {
  set(`reporting_${grantId}`, getReportingRequirements(grantId).map(r => r.id === id ? { ...r, ...patch } : r));
};

// ── REVIEWS ───────────────────────────────────────────────────────────────────
import { ApplicationReview, RedTeamReview } from '../types';
export const getReview = (grantId: string): ApplicationReview | null => get(`review_${grantId}`, null);
export const saveReview = (grantId: string, r: ApplicationReview) => set(`review_${grantId}`, r);
export const getRedTeamReview = (grantId: string): RedTeamReview | null => get(`redteam_${grantId}`, null);
export const saveRedTeamReview = (grantId: string, r: RedTeamReview) => set(`redteam_${grantId}`, r);

// ── ANALYSES ──────────────────────────────────────────────────────────────────
import { FunderPersona, SuccessPatternAnalysis, DifferentiationAnalysis, CohesionAnalysis } from '../types';
export const getFunderPersona = (grantId: string): FunderPersona | null => get(`persona_${grantId}`, null);
export const saveFunderPersona = (grantId: string, p: FunderPersona) => set(`persona_${grantId}`, p);
export const getSuccessPatterns = (grantId: string): SuccessPatternAnalysis | null => get(`patterns_${grantId}`, null);
export const saveSuccessPatterns = (grantId: string, s: SuccessPatternAnalysis) => set(`patterns_${grantId}`, s);
export const getDifferentiation = (grantId: string): DifferentiationAnalysis | null => get(`diff_${grantId}`, null);
export const saveDifferentiation = (grantId: string, d: DifferentiationAnalysis) => set(`diff_${grantId}`, d);
export const getCohesionAnalysis = (grantId: string): CohesionAnalysis | null => get(`cohesion_${grantId}`, null);
export const saveCohesionAnalysis = (grantId: string, a: CohesionAnalysis) => set(`cohesion_${grantId}`, a);

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
import { Document } from '../types';
export const getDocuments = (profileId: number): Document[] => get(`docs_${profileId}`, []);
export const addDocument = (profileId: number, name: string, category: string): Document => {
  const d: Document = { id: nextId(), profileId, name, category };
  set(`docs_${profileId}`, [...getDocuments(profileId), d]); return d;
};
export const deleteDocument = (profileId: number, docId: number) => {
  set(`docs_${profileId}`, getDocuments(profileId).filter(d => d.id !== docId));
};

// ── AUTH (simplified: no server, just localStorage session) ───────────────────
export const mockUser = { id: 1, username: 'Grant OS User', role: 'Admin' as const, isSubscribed: true, teamIds: [] as number[] };
export const getUser = () => mockUser;
export const isAuthenticated = () => true;
