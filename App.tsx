import React, { useState, useCallback, useEffect } from 'react';
import { FundingProfile, GrantOpportunity, GrantStatus, User, Team, Subscription, CustomRole } from './types';
import * as authService from './services/authService';
import * as teamService from './services/teamService';
import * as subscriptionService from './services/subscriptionService';
import * as brandingService from './services/brandingService';

import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import Login from './components/Login';
import AppConfigDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import TeamHub from './components/TeamHub';
import LandingPage from './components/LandingPage';
import PublicGrantView from './components/PublicGrantView';
import ResourceCenter from './components/ResourceCenter';
import PricingPage from './components/PricingPage';
import CustomerPortal from './components/CustomerPortal';
import Dashboard from './components/Dashboard';
import MainApp from './components/MainApp';
import IntelligencePlatform from './components/IntelligencePlatform';
import PipelineDashboard from './components/PipelineDashboard';

import { BrandingProvider, useBranding } from './contexts/BrandingProvider';

const ImpersonationBanner: React.FC = () => {
    const impersonator = authService.getImpersonator();
    if (!impersonator) return null;

    const handleStop = () => {
        authService.stopImpersonation();
        window.location.href = '/super-admin';
    };

    return (
        <div className="bg-yellow-400 text-black text-center p-2 font-bold text-sm sticky top-0 z-[100]">
            You are impersonating another user. <button onClick={handleStop} className="underline hover:text-red-700">Return to Admin</button>
        </div>
    );
};

const AuthenticatedApp: React.FC<{ user: User, onLogout: () => void, onSubscriptionChange: (user: User) => void }> = ({ user, onLogout, onSubscriptionChange }) => {
  const [location, setLocation] = useState(window.location.pathname);
  const { setBranding, resetBranding } = useBranding();

  useEffect(() => {
    const onLocationChange = () => setLocation(window.location.pathname);
    
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      onLocationChange();
    };

    window.addEventListener('popstate', onLocationChange);
    
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  const AppContainer: React.FC<{children: React.ReactNode}> = ({children}) => (
      <>
          <ImpersonationBanner />
          {children}
      </>
  );
  
  const grantIdMatch = location.match(/\/grant\/(.+)/);

  if (location === '/pricing') {
     return <AppContainer><PricingPage user={user} onSubscriptionSuccess={onSubscriptionChange} /></AppContainer>;
  }
  if (location === '/account') {
     return <AppContainer><CustomerPortal user={user} onSubscriptionChange={onSubscriptionChange} /></AppContainer>;
  }
  if (location === '/app') {
    return <AppContainer><MainApp user={user} onLogout={onLogout} onSubscriptionChange={onSubscriptionChange} /></AppContainer>;
  }
  if (location === '/resources') {
    return <AppContainer><div className="min-h-screen"><Header user={user} onLogout={onLogout} /><ResourceCenter /></div></AppContainer>;
  }
  if (location === '/app-config' && user.role === 'Admin') {
    return <AppContainer><div className="min-h-screen"><Header user={user} onLogout={onLogout} /><div className="p-8"><AppConfigDashboard /></div></div></AppContainer>;
  }
  if (location === '/super-admin' && user.role === 'Admin') {
    return <AppContainer><SuperAdminDashboard user={user} onLogout={onLogout} /></AppContainer>;
  }
  if (location.startsWith('/team-hub/')) {
      const teamId = parseInt(location.split('/')[2]);
      if (!isNaN(teamId)) {
          const team = teamService.getAllTeams().find(t => t.id === teamId);
          // FIX: The `hasPermission` function was missing from the team service. It has been added to correctly check user roles for team management capabilities.
          if (team && teamService.hasPermission(user.id, teamId, 'canManageTeam')) {
              return <AppContainer><TeamHub user={user} onLogout={onLogout} teamId={teamId} /></AppContainer>;
          }
      }
  }
  if (location === '/intelligence') {
      return <AppContainer><IntelligencePlatform user={user} onLogout={onLogout} /></AppContainer>;
  }
  if (location === '/pipeline') {
      return <AppContainer><PipelineDashboard user={user} onLogout={onLogout} /></AppContainer>;
  }
  // Any other path for a logged in user goes to the dashboard
  return <AppContainer><Dashboard user={user} onLogout={onLogout} /></AppContainer>;
}


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [location, setLocation] = useState(window.location.pathname);
  
  // Verify session on initial load
  useEffect(() => {
      const verifyUserSession = async () => {
        // This is special handling for the client-side impersonation demo
        const impersonatedUserJson = sessionStorage.getItem('impersonated_user');
        if (impersonatedUserJson) {
            setCurrentUser(JSON.parse(impersonatedUserJson));
        } else {
            const user = await authService.verifySession();
            setCurrentUser(user);
        }
        setIsInitialLoad(false);
      };
      verifyUserSession();
  }, []);

  useEffect(() => {
    // This effect handles public routing logic.
    const onLocationChange = () => setLocation(window.location.pathname);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      onLocationChange();
    };

    window.addEventListener('popstate', onLocationChange);
    
    return () => {
      window.removeEventListener('popstate', onLocationChange);
       window.history.pushState = originalPushState;
    };
  }, []);


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    window.history.pushState({}, '', '/dashboard');
    setLocation('/dashboard');
  };
  
  const handleSubscriptionChange = async () => {
    // Re-verify session to get latest user data from the "backend"
    const user = await authService.verifySession();
    setCurrentUser(user);
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    window.history.pushState({}, '', '/');
    setLocation('/');
  };

  if (isInitialLoad) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner message="Verifying session..." /></div>;
  }
  
  const grantIdMatch = location.match(/\/grant\/(.+)/);
  
  if (currentUser) {
    return (
      <BrandingProvider>
        <AuthenticatedApp 
          user={currentUser} 
          onLogout={handleLogout} 
          // @ts-ignore - We'll fix this later
          onSubscriptionChange={handleSubscriptionChange}
        />
      </BrandingProvider>
    );
  }

  // Public Routes
  if (grantIdMatch) {
    return <PublicGrantView grantId={grantIdMatch[1]} />;
  }
  if (location === '/resources') {
    return <ResourceCenter />;
  }
  if (location === '/login') {
    return <Login onLoginSuccess={handleLogin} />;
  }
  if (location === '/pricing') {
     return <PricingPage user={null} onSubscriptionSuccess={() => {}} />;
  }

  return <LandingPage />;
};

export default App;
