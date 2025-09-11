// FIX: Aliased Express types to prevent potential namespace conflicts with global types.
import express, { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { User, FundingProfile, Team, GrantOpportunity, GrantStatus } from '../src/types'; // Assuming types are shared

// Add 'user' property to Express's Request interface via declaration merging.
// This is the idiomatic way to handle custom request properties in Express with TypeScript.
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

const app = express();
const port = 3001; // Port for the backend server
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-an-env-file';

// --- Helper Functions ---
const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};


// --- Mock Database ---
const users: User[] = [
  { id: 1, username: 'user@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
  { id: 2, username: 'pro_user@example.com', role: 'User', isSubscribed: true, teamIds: [101, 102] },
  { id: 3, username: 'admin@example.com', role: 'Admin', isSubscribed: true, teamIds: [] },
  { id: 4, username: 'teammate@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
];

const teams: Team[] = [
    { 
      id: 101, 
      name: 'EcoInnovate Foundation', 
      members: [
        { userId: 1, role: 'Editor' },
        { userId: 2, role: 'Admin' },
        { userId: 4, role: 'Viewer' },
      ] 
    },
    { 
      id: 102, 
      name: 'Pro User\'s Side Project', 
      members: [{ userId: 2, role: 'Admin' }] 
    },
];

let profiles: FundingProfile[] = [
    {
        id: 1001,
        name: 'EcoInnovate Foundation',
        profileType: 'Non-Profit',
        industry: 'Environmental Conservation',
        stage: 'Established',
        description: 'A non-profit dedicated to funding and supporting projects that address climate change through technological innovation and community action.',
        fundingNeeds: 'Operational costs, project scaling, research grants for partners',
        owner: { type: 'team', id: 101 }
    },
    {
        id: 1002,
        name: 'Aperture Science Labs',
        profileType: 'Business',
        industry: 'Scientific Research & Development',
        stage: 'Growth',
        description: 'A cutting-edge research firm developing next-generation portal technology and AI assistants.',
        fundingNeeds: 'R&D for new portal gun, GLaDOS maintenance, facility expansion',
        owner: { type: 'team', id: 101 }
    },
     {
        id: 1,
        name: 'Personal Art Project',
        profileType: 'Individual',
        industry: 'Digital Art & Media',
        stage: 'Idea',
        description: 'A personal project to create a series of interactive digital sculptures exploring the intersection of nature and technology.',
        fundingNeeds: 'Hardware (VR headset, high-spec PC), software licenses, marketing budget',
        owner: { type: 'user', id: 1 }
    }
];

let trackedGrants: Record<number, GrantOpportunity[]> = { // userId -> grants[]
    1: [], 2: [], 3: [], 4: [],
};
let grantStatuses: Record<number, Record<string, GrantStatus>> = { // userId -> { grantId -> status }
    1: {}, 2: {}, 3: {}, 4: {},
};


// --- Middleware ---
app.use(cors()); // Allow requests from our frontend
app.use(express.json());

// --- API Routes ---

// 1. Authentication
app.post('/api/auth/login', (req: ExpressRequest, res: ExpressResponse) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (user) {
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// FIX: Changed AuthenticatedRequest to Request. The 'user' property is now available via declaration merging.
const authenticateToken = (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);
  
  // This is special handling for the client-side impersonation demo.
  if (token.startsWith('mock-token-for-user-')) {
    const userId = parseInt(token.replace('mock-token-for-user-', ''));
    const user = users.find(u => u.id === userId);
    if (user) {
        req.user = { userId: user.id, role: user.role };
        return next();
    } else {
        return res.sendStatus(403);
    }
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};


// FIX: Changed AuthenticatedRequest to Request.
app.get('/api/auth/me', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const user = users.find(u => u.id === req.user!.userId);
    if (user) {
        res.json({ user });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// 2. Profiles API (CRUD)
// FIX: Changed AuthenticatedRequest to Request.
app.get('/api/profiles', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const userId = req.user!.userId;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userProfiles = profiles.filter(p => 
        (p.owner.type === 'user' && p.owner.id === userId) ||
        (p.owner.type === 'team' && user.teamIds.includes(p.owner.id))
    );
    res.json(userProfiles);
});

// FIX: Changed AuthenticatedRequest to Request.
app.post('/api/profiles', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const userId = req.user!.userId;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profileData = req.body;

    let owner: FundingProfile['owner'];
    if (profileData.profileType === 'Individual') {
        owner = { type: 'user', id: userId };
    } else {
        // Default to user's first team if not individual. A real app might have a team selector.
        const firstTeamId = user.teamIds[0];
        if (!firstTeamId) {
            return res.status(400).json({ message: 'You must belong to a team to create a Business or Non-Profit profile.' });
        }
        owner = { type: 'team', id: firstTeamId };
    }

    const newProfile: FundingProfile = {
        ...profileData,
        id: Date.now(),
        owner
    };
    profiles.push(newProfile);
    res.status(201).json(newProfile);
});

// FIX: Changed AuthenticatedRequest to Request.
app.put('/api/profiles/:id', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const profileId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const user = users.find(u => u.id === userId);
    const updatedData = req.body;

    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return res.status(404).json({ message: 'Profile not found' });

    const profile = profiles[profileIndex];
    // Security check: user must own the profile or be part of the owning team
    const isOwner = (profile.owner.type === 'user' && profile.owner.id === userId) ||
                    (profile.owner.type === 'team' && user?.teamIds.includes(profile.owner.id));

    if (!isOwner && user?.role !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to edit this profile.' });
    }
    
    // Don't allow changing the owner or id via update
    delete updatedData.id;
    delete updatedData.owner;

    profiles[profileIndex] = { ...profile, ...updatedData };
    res.json(profiles[profileIndex]);
});

// FIX: Changed AuthenticatedRequest to Request.
app.delete('/api/profiles/:id', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const profileId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const user = users.find(u => u.id === userId);

    const profileIndex = profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return res.status(404).json({ message: 'Profile not found' });
    
    const profile = profiles[profileIndex];
    const isOwner = (profile.owner.type === 'user' && profile.owner.id === userId) ||
                    (profile.owner.type === 'team' && user?.teamIds.includes(profile.owner.id));

    if (!isOwner && user?.role !== 'Admin') {
        return res.status(403).json({ message: 'You do not have permission to delete this profile.' });
    }

    profiles = profiles.filter(p => p.id !== profileId);
    res.sendStatus(204);
});

// 3. Grants & Statuses API
app.get('/api/grants', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const userId = req.user!.userId;
    res.json(trackedGrants[userId] || []);
});

app.post('/api/grants', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const userId = req.user!.userId;
    const grant = req.body as GrantOpportunity;

    if (!trackedGrants[userId]) {
        trackedGrants[userId] = [];
    }
    if (!grantStatuses[userId]) {
        grantStatuses[userId] = {};
    }

    const grantExists = trackedGrants[userId].some(g => g.url === grant.url && g.name === grant.name);
    if (!grantExists) {
        trackedGrants[userId].push(grant);
        const grantId = getGrantId(grant);
        if (!grantStatuses[userId][grantId]) {
            grantStatuses[userId][grantId] = 'Interested';
        }
    }
    res.status(201).json(grant);
});

app.get('/api/grants/statuses', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const userId = req.user!.userId;
    res.json(grantStatuses[userId] || {});
});

app.put('/api/grants/status', authenticateToken, (req: ExpressRequest, res: ExpressResponse) => {
    const userId = req.user!.userId;
    const { grantId, status } = req.body as { grantId: string; status: GrantStatus };

    if (!grantStatuses[userId]) {
        grantStatuses[userId] = {};
    }
    grantStatuses[userId][grantId] = status;
    res.status(200).json({ grantId, status });
});



// --- Start Server ---
app.listen(port, () => {
  console.log(`GrantFinder AI backend listening at http://localhost:${port}`);
});
