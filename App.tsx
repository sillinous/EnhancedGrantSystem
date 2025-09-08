import React, { useState, useCallback, useEffect } from 'react';
import { FundingProfile, GrantOpportunity, GrantStatus, User, Team, Subscription } from './types';
import { findGrants } from './services/geminiService';
import { getProfiles, saveProfiles } from './services/profileService';
import { getAllGrantStatuses, saveGrantStatus } from './services/grantStatusService';
import * as authService from './services/authService';
import * as teamService from './services/teamService';
import * as subscriptionService from './services/subscriptionService';
import * as trackedGrantService from './services/trackedGrantService';
import Header from './components/Header';
import OpportunitiesDashboard from './components/OpportunitiesDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ProfileSelection from './components/ProfileSelection';
import Login from './components/Login';
import AppConfigDashboard from './components/AppConfigDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import TeamHub from './components/TeamHub';
import LandingPage from './components/LandingPage';
import PublicGrantView from './components/PublicGrantView';
import ResourceCenter from './components/ResourceCenter';
import Modal from './components/Modal';
import TeamManager from './components/TeamManager';
import PricingPage from './components/PricingPage';
import CustomerPortal from './components/CustomerPortal';
import Dashboard from './components/Dashboard';

const MainApp: React.FC<{ user: User, onLogout: () => void, onSubscriptionChange: (user: User) => void }> = ({ user, onLogout, onSubscriptionChange }) => {
  const [profiles, setProfiles] = useState<FundingProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeProfile, setActiveProfile] = useState<FundingProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<FundingProfile | null>(null);
  const [grants, setGrants] = useState<GrantOpportunity[]>([]);
  const [grantStatuses, setGrantStatuses] = useState<Record<string, GrantStatus>>({});
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);

  useEffect(() => {
    const userProfiles = getProfiles();
    const userTeams = teamService.getTeamsForUser(user.id);
    
    // Filter profiles to only those the user has access to
    const accessibleProfiles = userProfiles.filter(p => {
        if (p.owner.type === 'user') {
            return p.owner.id === user.id;
        }
        if (p.owner.type === 'team') {
            return user.teamIds.includes(p.owner.id);
        }
        return false;
    });

    setProfiles(accessibleProfiles);
    setTeams(userTeams);
    setGrantStatuses(getAllGrantStatuses());
    setIsInitialLoad(false);
  }, [user.id]);

  useEffect(() => {
    if (!isInitialLoad) {
      // In a multi-user environment, we only save the profiles this user can see.
      // A real backend would handle permissions.
      const allProfiles = getProfiles();
      const otherProfiles = allProfiles.filter(p => !profiles.some(up => up.id === p.id));
      saveProfiles([...otherProfiles, ...profiles]);
    }
  }, [profiles, isInitialLoad]);

  const handleSearch = useCallback(async (profileToSearch: FundingProfile) => {
    setIsLoading(true);
    setError(null);
    setGrants([]);
    setSources([]);
    try {
      const result = await findGrants(profileToSearch);
      setGrants(result.opportunities);
      setSources(result.sources || []);
      setActiveProfile(profileToSearch);
    } catch (e) {
      console.error(e);
      setError('Failed to find grant opportunities. The AI may be busy or an error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateOrUpdateAndSearch = useCallback(async (profileData: Omit<FundingProfile, 'id' | 'owner'>, id?: number) => {
      let profileToSearch: FundingProfile;
      const owner = profileData.profileType === 'Individual' 
        ? { type: 'user' as const, id: user.id } 
        : (editingProfile?.owner || (teams.length > 0 ? { type: 'team' as const, id: teams[0].id } : { type: 'user' as const, id: user.id }));

      if(owner.type === 'team' && !user.teamIds.includes(owner.id)) {
           alert("You must be part of a team to create a Business or Non-Profit profile. Please create or join a team first.");
           return;
      }

      const profileWithOwner = { ...profileData, owner };

      if (id) {
        profileToSearch = { ...profileWithOwner, id };
        setProfiles(prev => prev.map(p => p.id === id ? profileToSearch : p));
      } else {
        profileToSearch = { ...profileWithOwner, id: Date.now() };
        setProfiles(prev => [...prev, profileToSearch]);
      }
      setEditingProfile(null);
      await handleSearch(profileToSearch);
  }, [handleSearch, user, teams, editingProfile]);


  const handleSelectAndSearch = useCallback(async (profile: FundingProfile) => {
    await handleSearch(profile);
  }, [handleSearch]);

  const handleDeleteProfile = useCallback((profileId: number) => {
    setProfiles(prev => prev.filter(p => p.id !== profileId));
  }, []);

  const handleStartEdit = useCallback((profile: FundingProfile) => {
    setEditingProfile(profile);
    const formElement = document.getElementById('profile-form-section');
    formElement?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingProfile(null);
  }, []);
  
  const handleCreateTeam = (teamName: string) => {
    const newTeam = teamService.createTeam(teamName, user.id);
    setTeams(prev => [...prev, newTeam]);
    setIsTeamManagerOpen(false);
  };

  const handleReset = useCallback(() => {
    setActiveProfile(null);
    setGrants([]);
    setSources([]);
    setError(null);
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeProfile) {
      handleSearch(activeProfile);
    }
  }, [activeProfile, handleSearch]);

  const handleStatusChange = useCallback((grant: GrantOpportunity, status: GrantStatus) => {
    trackedGrantService.addTrackedGrant(grant);
    setGrantStatuses(prev => {
      const newStatuses = { ...prev };
      const grantId = `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
      newStatuses[grantId] = status;
      saveGrantStatus(grantId, status);
      return newStatuses;
    });
  }, []);

  return (
    <>
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header
        user={user}
        onLogout={onLogout}
        onReset={handleReset}
        isPublic={false}
      />
      <main className="container mx-auto p-4 md:p-8">
        {!activeProfile ? (
          <ProfileSelection
            user={user}
            teams={teams}
            profiles={profiles}
            onCreateOrUpdate={handleCreateOrUpdateAndSearch}
            onSelect={handleSelectAndSearch}
            onDelete={handleDeleteProfile}
            isLoading={isLoading}
            onEdit={handleStartEdit}
            onCancelEdit={handleCancelEdit}
            profileToEdit={editingProfile}
            onOpenTeamManager={() => setIsTeamManagerOpen(true)}
          />
        ) : (
          <div className="animate-fade-in">
            {isLoading && <LoadingSpinner message="Matching your profile against our global grants database..." />}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && !error && (
              <OpportunitiesDashboard
                profile={activeProfile}
                grants={grants}
                grantStatuses={grantStatuses}
                onStatusChange={handleStatusChange}
                sources={sources}
                onRefresh={handleRefresh}
                isRefreshing={isLoading}
                user={user}
              />
            )}
          </div>
        )}
      </main>
    </div>
    <Modal
      isOpen={isTeamManagerOpen}
      onClose={() => setIsTeamManagerOpen(false)}
      title="Create a New Team"
    >
        <TeamManager onCreateTeam={handleCreateTeam} />
    </Modal>
    </>
  );
};

const ImpersonationBanner: React.FC = () => {
    const impersonator = authService.getImpersonator();
    if (!impersonator) return null;

    const handleStop = () => {
        authService.stopImpersonation();
        window.location.href = '/super-admin';
    };

    return (
        <div className="bg-yellow-400 text-black text-center p-2 font-bold text-sm">
            You are impersonating another user. <button onClick={handleStop} className="underline hover:text-red-700">Return to Admin</button>
        </div>
    );
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [location, setLocation] = useState(window.location.pathname);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const onLocationChange = () => setLocation(window.location.pathname);
    // Push a new state to history when navigating internally
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      onLocationChange();
    };

    window.addEventListener('popstate', onLocationChange);
    setIsInitialLoad(false);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      setSubscription(subscriptionService.getSubscription(currentUser.id));
    } else {
      setSubscription(null);
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    window.history.pushState({}, '', '/dashboard');
  };
  
  const handleSubscriptionChange = (user: User) => {
    setCurrentUser(user);
    setSubscription(subscriptionService.getSubscription(user.id));
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    window.history.pushState({}, '', '/');
  };

  if (isInitialLoad) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }
  
  const grantIdMatch = location.match(/\/grant\/(.+)/);

  if (currentUser) {
    const AppContainer: React.FC<{children: React.ReactNode}> = ({children}) => (
        <>
            <ImpersonationBanner />
            {children}
        </>
    );

    if (location === '/pricing') {
       return <AppContainer><PricingPage user={currentUser} onSubscriptionSuccess={handleSubscriptionChange} /></AppContainer>;
    }
    if (location === '/account') {
       return <AppContainer><CustomerPortal user={currentUser} onSubscriptionChange={handleSubscriptionChange} /></AppContainer>;
    }
    if (location === '/app') {
      return <AppContainer><MainApp user={currentUser} onLogout={handleLogout} onSubscriptionChange={handleSubscriptionChange} /></AppContainer>;
    }
     if (location === '/resources') {
      return <AppContainer><div className="min-h-screen"><Header user={currentUser} onLogout={handleLogout} isPublic={false} /><ResourceCenter /></div></AppContainer>;
    }
    if (location === '/app-config' && currentUser.role === 'Admin') {
      return <AppContainer><div className="min-h-screen"><Header user={currentUser} onLogout={handleLogout} isPublic={false} /><div className="p-8"><AppConfigDashboard /></div></div></AppContainer>;
    }
    if (location === '/super-admin' && currentUser.role === 'Admin') {
      return <AppContainer><SuperAdminDashboard user={currentUser} onLogout={handleLogout} /></AppContainer>;
    }
    if (location.startsWith('/team-hub/')) {
        const teamId = parseInt(location.split('/')[2]);
        if (!isNaN(teamId)) {
            const role = teamService.getUserRoleInTeam(currentUser.id, teamId);
            if (role === 'Admin') {
                return <AppContainer><TeamHub user={currentUser} onLogout={handleLogout} teamId={teamId} /></AppContainer>;
            }
        }
    }
    // Any other path for a logged in user goes to the dashboard
    return <AppContainer><Dashboard user={currentUser} onLogout={handleLogout} /></AppContainer>;
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

  return <LandingPage />;
};

export default App;
