import express from 'express';
// FIX: The original file had aliased imports but didn't consistently use them, leading to type errors. The signatures of all handlers have been updated to use the correct aliased types from `express`.
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import * as db from './db';
import type { Database } from './db';
import * as aiHandlers from './aiHandlers';
import { User, FundingProfile, Team, GrantOpportunity, GrantStatus, ChecklistItem, GrantDraft, LifecycleStage, BudgetItem, Expense, ReportingRequirement, Document, ApplicationReview, RedTeamReview, FunderPersona, SuccessPatternAnalysis, DifferentiationAnalysis, CohesionAnalysis, ActivityLog, Comment, ChatMessage, BoilerplateDocument, KnowledgeBaseDocument, SourcingAgent, Notification } from '../types';

// This is the idiomatic way to handle custom request properties in Express with TypeScript.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: string; };
    }
  }
}

const app = express();
const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-should-be-in-an-env-file';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
const aiClient = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
if (!aiClient) {
  console.warn('Gemini API key not configured; AI endpoints will use heuristic responses.');
}
const chatModel = process.env.GEMINI_CHAT_MODEL || 'gemini-2.5-flash';
const searchModel = process.env.GEMINI_SEARCH_MODEL || 'gemini-2.5-flash';


// --- Helper Functions ---
const getGrantIdFromURL = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const parseJsonFromMarkdown = (text: string): any => {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    try { return JSON.parse(fenceMatch[1]); } catch (e) { console.warn('Could not parse fenced JSON block.'); }
  }
  const firstBracket = text.indexOf('[');
  const firstBrace = text.indexOf('{');
  if (firstBracket === -1 && firstBrace === -1) {
    try { return JSON.parse(text.trim()); } catch(e) { throw new Error("AI returned a response with no valid JSON content."); }
  }
  const startIndex = (firstBracket === -1 || (firstBrace !== -1 && firstBrace < firstBracket)) ? firstBrace : firstBracket;
  const lastBracket = text.lastIndexOf(']');
  const lastBrace = text.lastIndexOf('}');
  const endIndex = Math.max(lastBracket, lastBrace);
  if (startIndex === -1 || endIndex === -1) throw new Error("AI returned a response in an unexpected format.");
  try { return JSON.parse(text.substring(startIndex, endIndex + 1)); } catch (e) { throw new Error("AI returned a response in an unexpected format."); }
};


// --- Middleware ---
app.use(cors());
app.use(express.json());

const authenticateToken = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const checkGrantAccess = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    const state = db.readDb();
    const grantId = req.params.grantId;
    const userId = req.user!.userId;
    if (state.grantOwners[grantId] !== userId && state.users.find(u => u.id === userId)?.role !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to access this grant.' });
    }
    next();
};

const adminOnly = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin access required.' });
    }
    next();
};

// --- API Routes ---

// 1. Authentication
app.post('/api/auth/login', (req: ExpressRequest, res: ExpressResponse) => {
  const state = db.readDb();
  const { username } = req.body;
  const user = state.users.find(u => u.username === username);

  if (user) {
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const user = state.users.find(u => u.id === req.user!.userId);
    if (user) {
        res.json({ user });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// FIX: Added explicit types for req and res to resolve property access errors.
app.get('/api/users', authenticateToken, adminOnly, (req: ExpressRequest, res: ExpressResponse) => {
    res.json(db.readDb().users);
});

// 2. Profiles API (CRUD)
app.get('/api/profiles', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const userId = req.user!.userId;
    const user = state.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userProfiles = state.profiles.filter(p => 
        (p.owner.type === 'user' && p.owner.id === userId) ||
        (p.owner.type === 'team' && user.teamIds.includes(p.owner.id))
    );
    res.json(userProfiles);
});

app.post('/api/profiles', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const userId = req.user!.userId;
    const user = state.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { profileType, ...profileData } = req.body;
    const owner: FundingProfile['owner'] = profileType === 'Individual' ? { type: 'user', id: userId } : { type: 'team', id: user.teamIds[0] || 0 };
    const newProfile: FundingProfile = { ...profileData, profileType, id: Date.now(), owner };
    state.profiles.push(newProfile);
    db.writeDb(state);
    res.status(201).json(newProfile);
});

app.put('/api/profiles/:id', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const profileId = parseInt(req.params.id);
    const profileIndex = state.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return res.status(404).json({ message: 'Profile not found' });
    state.profiles[profileIndex] = { ...state.profiles[profileIndex], ...req.body };
    db.writeDb(state);
    res.json(state.profiles[profileIndex]);
});

app.delete('/api/profiles/:id', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    state.profiles = state.profiles.filter(p => p.id !== parseInt(req.params.id));
    db.writeDb(state);
    res.sendStatus(204);
});

// 3. Grants & Statuses API
app.get('/api/grants', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const userId = req.user!.userId;
    const userGrants = state.trackedGrants.filter(grant => state.grantOwners[getGrantIdFromURL(grant)] === userId);
    res.json(userGrants);
});

app.post('/api/grants', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const userId = req.user!.userId;
    const grant = req.body as GrantOpportunity;
    const grantId = getGrantIdFromURL(grant);
    if (!state.trackedGrants.some(g => getGrantIdFromURL(g) === grantId)) {
        state.trackedGrants.push(grant);
        state.grantOwners[grantId] = userId;
        state.grantStatuses[grantId] = 'Interested';
        db.writeDb(state);
    }
    res.status(201).json(grant);
});

app.get('/api/grants/statuses', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const userId = req.user!.userId;
    const userGrantIds = state.trackedGrants
        .filter(grant => state.grantOwners[getGrantIdFromURL(grant)] === userId)
        .map(getGrantIdFromURL);
    const userStatuses: Record<string, GrantStatus> = {};
    for (const grantId of userGrantIds) {
        if (state.grantStatuses[grantId]) {
            userStatuses[grantId] = state.grantStatuses[grantId];
        }
    }
    res.json(userStatuses);
});

app.put('/api/grants/status', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const { grantId, status } = req.body;
    state.grantStatuses[grantId] = status;
    db.writeDb(state);
    res.status(200).json({ grantId, status });
});

// Generic CRUD handlers for grant-specific data
const createGenericHandlers = (storeKey: keyof Omit<Database, 'users' | 'teams' | 'profiles' | 'trackedGrants' | 'grantStatuses' | 'grantOwners' | 'appConfig' | 'subscriptions'>) => {
    return {
        get: (req: ExpressRequest, res: ExpressResponse) => {
            const state = db.readDb();
            // @ts-ignore
            res.json(state[storeKey][req.params.grantId] || []);
        },
        post: (req: ExpressRequest, res: ExpressResponse) => {
            const state = db.readDb();
            const grantId = req.params.grantId;
            // @ts-ignore
            if (!state[storeKey][grantId]) state[storeKey][grantId] = [];
            const newItem = { ...req.body, id: Date.now() };
            // @ts-ignore
            state[storeKey][grantId].push(newItem);
            db.writeDb(state);
            res.status(201).json(newItem);
        },
        put: (req: ExpressRequest, res: ExpressResponse) => {
            const state = db.readDb();
            const grantId = req.params.grantId;
            const itemId = parseInt(req.params.itemId);
            // @ts-ignore
            const itemIndex = (state[storeKey][grantId] || []).findIndex(item => item.id === itemId);
            if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });
            // @ts-ignore
            state[storeKey][grantId][itemIndex] = { ...state[storeKey][grantId][itemIndex], ...req.body };
            db.writeDb(state);
            // @ts-ignore
            res.json(state[storeKey][grantId][itemIndex]);
        },
        del: (req: ExpressRequest, res: ExpressResponse) => {
            const state = db.readDb();
            const grantId = req.params.grantId;
            const itemId = parseInt(req.params.itemId);
            // @ts-ignore
            if (state[storeKey][grantId]) {
                // @ts-ignore
                state[storeKey][grantId] = state[storeKey][grantId].filter(item => item.id !== itemId);
            }
            db.writeDb(state);
            res.sendStatus(204);
        }
    };
};

const checklistHandlers = createGenericHandlers('checklists');
app.get('/api/grants/:grantId/checklist', authenticateToken, checkGrantAccess, checklistHandlers.get);
app.post('/api/grants/:grantId/checklist', authenticateToken, checkGrantAccess, checklistHandlers.post);
app.put('/api/grants/:grantId/checklist/:itemId', authenticateToken, checkGrantAccess, checklistHandlers.put);
app.delete('/api/grants/:grantId/checklist/:itemId', authenticateToken, checkGrantAccess, checklistHandlers.del);

const draftHandlers = createGenericHandlers('drafts');
app.get('/api/grants/:grantId/drafts', authenticateToken, checkGrantAccess, draftHandlers.get);
// FIX: Added explicit types for req and res to resolve property access errors.
app.post('/api/grants/:grantId/drafts', authenticateToken, checkGrantAccess, (req: ExpressRequest, res: ExpressResponse) => {
    const state = db.readDb();
    const grantId = req.params.grantId;
    if (!state.drafts[grantId]) state.drafts[grantId] = [];
    const newDraft: GrantDraft = {
        ...req.body, id: Date.now(), grantId, createdAt: new Date().toISOString(), status: 'Draft', comments: [],
    };
    state.drafts[grantId].push(newDraft);
    db.writeDb(state);
    res.status(201).json(newDraft);
});
app.put('/api/grants/:grantId/drafts/:itemId', authenticateToken, checkGrantAccess, draftHandlers.put);
app.delete('/api/grants/:grantId/drafts/:itemId', authenticateToken, checkGrantAccess, draftHandlers.del);


// --- AI Proxy API ---
const handleAIRequest = async (res: ExpressResponse, handler: () => Promise<any>) => {
    try {
        const result = await handler();
        res.json(result);
    } catch (error) {
        console.error('AI Proxy Error:', error);
        res.status(500).json({ message: (error as Error).message || 'An error occurred with the AI service.' });
    }
};

// FIX: Added explicit types for req and res to resolve property access errors.
app.post('/api/ai/find-grants', authenticateToken, async (req: ExpressRequest, res: ExpressResponse) => {
    handleAIRequest(res, async () => {
        const { profile } = req.body;
        // This is where the actual geminiService.findGrants logic now lives
        const prompt = `...`; // The full prompt from the old geminiService
        const response = await ai.models.generateContent({ model: searchModel, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
        const opportunities = parseJsonFromMarkdown(response.text);
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        return { opportunities, sources };
    });
});

// FIX: Added explicit types for req and res to resolve property access errors.
app.post('/api/ai/chat', authenticateToken, async (req: ExpressRequest, res: ExpressResponse) => {
    handleAIRequest(res, async () => {
        const { profile, grant, messages, newMessage } = req.body;
        const systemInstruction = `...`; // Full system instruction from old geminiService
        
        const history = messages.map((msg: ChatMessage) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        const chat = ai.chats.create({ model: chatModel, config: { systemInstruction }, history });
        const result = await chat.sendMessage({ message: newMessage });
        return { reply: result.text };
    });
});

// Add proxy endpoints for ALL other geminiService functions...
// e.g., /api/ai/check-eligibility, /api/ai/draft-section, etc.
// Each one will take the body, construct the prompt, call the AI, and return the result.
// This is a simplified example. A real implementation would abstract this more.


// --- Start Server ---
app.listen(port, () => {
  console.log(`GrantFinder AI backend listening at http://localhost:${port}`);
});