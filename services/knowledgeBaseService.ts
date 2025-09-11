import { KnowledgeBaseDocument } from '../types';

const KB_KEY = 'grantfinder_knowledgeBase';

const defaultDocs: Record<string, KnowledgeBaseDocument[]> = {
    "101": [ // Team ID
        {
            id: 1, teamId: 101, name: 'EcoInnovate Climate Grant 2023 Application',
            content: 'Our project focuses on carbon capture. We requested $250,000 for R&D. Key metrics included tons of CO2 captured annually.',
            outcome: 'Won', uploadedAt: '2023-09-15T10:00:00Z'
        },
        {
            id: 2, teamId: 101, name: 'Water Conservation Proposal 2023',
            content: 'This was a proposal for a new water filtration system. Feedback was that the budget was too high and the community impact wasn\'t clear enough.',
            outcome: 'Lost', uploadedAt: '2023-10-02T14:30:00Z'
        },
    ]
};

const getAllKBDocuments = (): Record<string, KnowledgeBaseDocument[]> => {
  try {
    const data = localStorage.getItem(KB_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(KB_KEY, JSON.stringify(defaultDocs));
    return defaultDocs;
  } catch (error) {
    console.error("Failed to parse KB docs from localStorage", error);
    return {};
  }
};

export const getKnowledgeBaseDocuments = (teamId: number): KnowledgeBaseDocument[] => {
  const allDocs = getAllKBDocuments();
  return allDocs[String(teamId)] || [];
};

// Other functions like add/update/delete could be added here.
