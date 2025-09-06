
import React, { useState } from 'react';
import { User } from '../types';
import * as authService from '../services/authService';
import LoadingSpinner from './LoadingSpinner';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      const user = authService.login(username, password);
      setIsLoading(false);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Invalid username or password.');
      }
    }, 500);
  };
  
  const handleDemoLogin = (user: 'user' | 'pro' | 'admin') => {
      let email = '';
      if (user === 'user') email = 'user@example.com';
      if (user === 'pro') email = 'pro_user@example.com';
      if (user === 'admin') email = 'admin@example.com';
      setUsername(email);
      setPassword('password'); // Use a dummy password for demo
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="bg-primary p-3 rounded-xl inline-block mb-4">
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
          <h1 className="text-3xl font-bold text-primary">GrantFinder AI</h1>
          <p className="text-gray-600 mt-2">Sign in to unlock your funding potential.</p>
        </div>
        
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary"
                placeholder="••••••••"
              />
            </div>
             {error && <p className="text-sm text-red-600">{error}</p>}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
              >
                {isLoading ? <LoadingSpinner size="small" message="Signing in..." /> : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center text-sm">
            <p className="text-gray-500">For demonstration purposes:</p>
            <div className="mt-2 flex justify-center gap-2">
                <button onClick={() => handleDemoLogin('user')} className="text-primary hover:underline">Log in as User</button>
                <span>&middot;</span>
                <button onClick={() => handleDemoLogin('pro')} className="text-primary hover:underline">Pro User</button>
                <span>&middot;</span>
                <button onClick={() => handleDemoLogin('admin')} className="text-primary hover:underline">Admin</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
