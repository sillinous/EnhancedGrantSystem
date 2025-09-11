// FIX: Import Request, Response, and NextFunction for explicit typing.
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
// bodyParser is deprecated; using express.json() instead.
// import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import { User } from '../src/types'; // Assuming types are shared

const app = express();
const port = 3001; // Port for the backend server
const JWT_SECRET = 'your-super-secret-key-that-should-be-in-an-env-file';

// --- Mock Database ---
const users: User[] = [
  { id: 1, username: 'user@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
  { id: 2, username: 'pro_user@example.com', role: 'User', isSubscribed: true, teamIds: [101, 102] },
  { id: 3, username: 'admin@example.com', role: 'Admin', isSubscribed: true, teamIds: [] },
  { id: 4, username: 'teammate@example.com', role: 'User', isSubscribed: false, teamIds: [101] },
];

// --- Middleware ---
app.use(cors()); // Allow requests from our frontend
// FIX: Replaced deprecated bodyParser.json() with the built-in express.json() middleware.
app.use(express.json());

// --- API Routes ---

// 1. Authentication
// FIX: Add explicit types for req and res to resolve type inference issues.
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  // In a real app, you'd hash the password and compare it to a stored hash.
  // Here, we're just checking the username.
  const user = users.find(u => u.username === username);

  if (user) {
    // User found, create a JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );
    
    res.json({ token, user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Middleware to verify JWT
// FIX: Use imported Request, Response, NextFunction types to ensure properties like .headers and .sendStatus are available.
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  // FIX: Corrected typo from JWT_secret to JWT_SECRET.
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403); // Token is no longer valid
    (req as any).user = user;
    next();
  });
};


// 2. Get current user from token
// FIX: Add explicit types for req and res to resolve type inference issues.
app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    // This is part of the client-side impersonation demo.
    // In a real system, the token itself would be an impersonation token.
    if (token.startsWith('mock-token-for-user-')) {
        const userId = parseInt(token.replace('mock-token-for-user-', ''));
        const user = users.find(u => u.id === userId);
        if (user) {
            return res.json({ user });
        } else {
            return res.status(404).json({ message: 'Impersonated user not found' });
        }
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        
        const user = users.find(u => u.id === decoded.userId);
        if (user) {
            res.json({ user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});


// --- Start Server ---
app.listen(port, () => {
  console.log(`GrantFinder AI backend listening at http://localhost:${port}`);
});