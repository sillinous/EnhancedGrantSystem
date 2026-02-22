// All AI calls now use aiService.ts
export * from './aiService';

export const analyzeFundingTrends = async (sector: string) => ({ sector, trends: [], generatedAt: new Date().toISOString() });
export const searchKnowledgeBase = async (_q: string, _teamId: number) => ({ results: [] });
export const generateLessonsLearned = async (_teamId: number) => ({ findings: [], generatedAt: new Date().toISOString() });
