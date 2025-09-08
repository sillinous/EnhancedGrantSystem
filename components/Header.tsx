import React, { useState, useEffect } from 'react';
import { User, Team } from '../types';
import * as teamService from '../services/teamService';
import { LogOut, LayoutDashboard, UserCircle, Search, ChevronDown, Settings, Shield, Users, Star, BookOpen, BrainCircuit, LayoutGrid } from 'lucide-react';
import { useBranding } from '../contexts/BrandingProvider';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamAdminOf, setTeamAdminOf] = useState<Team[]>([]);
  const { branding } = useBranding();

  useEffect(() => {
    if (user) {
      const allTeams = teamService.getTeamsForUser(user.id);
      setUserTeams(allTeams);
      // FIX: The `hasPermission` function was missing from the team service. It has been added to correctly check user roles for team management capabilities.
      setTeamAdminOf(allTeams.filter(team => teamService.hasPermission(user.id, team.id, 'canManageTeam')));
    }
  }, [user]);
  
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setIsUserMenuOpen(false);
  };

  const handleProfilesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo('/app');
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" onClick={(e) => { e.preventDefault(); navigateTo(user ? '/dashboard' : '/'); }} className="flex items-center cursor-pointer">
             {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Team Logo" className="h-8 w-auto" />
             ) : (
                <>
                <div className="bg-primary p-2 rounded-lg mr-3">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h1 className="text-xl font-bold text-primary">GrantFinder AI</h1>
                </>
             )}
          </a>
          
          {!user ? (
             <div className="flex items-center gap-2">
                 <a href="/resources" onClick={(e) => { e.preventDefault(); navigateTo('/resources'); }} className="text-sm font-medium text-gray-600 hover:text-primary">Resources</a>
                 <a href="/pricing" onClick={(e) => { e.preventDefault(); navigateTo('/pricing'); }} className="text-sm font-medium text-gray-600 hover:text-primary">Pricing</a>
                 <button onClick={() => navigateTo('/login')} className="px-4 py-2 text-sm font-medium text-primary rounded-md hover:bg-primary/10 transition-colors">Sign In</button>
                 <button onClick={() => navigateTo('/login')} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors">Sign Up</button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              {/* Main Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigateTo('/dashboard'); }} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <LayoutDashboard size={16} className="mr-1.5" /> Dashboard
                </a>
                <a href="/pipeline" onClick={(e) => { e.preventDefault(); navigateTo('/pipeline'); }} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <LayoutGrid size={16} className="mr-1.5" /> Pipeline
                </a>
                <a href="/app" onClick={handleProfilesClick} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <Search size={16} className="mr-1.5" /> Profiles & Search
                </a>
                <a href="/intelligence" onClick={(e) => { e.preventDefault(); navigateTo('/intelligence'); }} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <BrainCircuit size={16} className="mr-1.5" /> Intelligence
                </a>
                 <a href="/pricing" onClick={(e) => { e.preventDefault(); navigateTo('/pricing'); }} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <Star size={16} className="mr-1.5 text-yellow-500 fill-current" /> Pricing
                </a>
                <a href="/resources" onClick={(e) => { e.preventDefault(); navigateTo('/resources'); }} className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                    <BookOpen size={16} className="mr-1.5" /> Resources
                </a>
              </nav>

              <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(prev => !prev)}
                  className="flex items-center gap-2"
                >
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.username.split('@')[0]}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={16} className="text-gray-500"/>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-20" onMouseLeave={() => setIsUserMenuOpen(false)}>
                    <div className="p-2 border-b">
                        <p className="text-sm font-semibold px-2 truncate">{user.username}</p>
                        <p className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${user.isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                          {user.isSubscribed ? 'Pro Plan' : 'Free Plan'}
                        </p>
                    </div>
                    <div className="p-1">
                      <a href="/account" onClick={(e) => {e.preventDefault(); navigateTo('/account')}} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                        <UserCircle size={16} /> Account
                      </a>
                      {teamAdminOf.length > 0 && (
                        <a href={`/team-hub/${teamAdminOf[0].id}`} onClick={(e) => {e.preventDefault(); navigateTo(`/team-hub/${teamAdminOf[0].id}`)}} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                          <Users size={16} /> Organization Hub
                        </a>
                      )}
                    </div>
                    {user.role === 'Admin' && (
                      <div className="p-1 border-t">
                        <a href="/super-admin" onClick={(e)=>{e.preventDefault(); navigateTo('/super-admin')}} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                          <Shield size={16} /> Super Admin
                        </a>
                        <a href="/app-config" onClick={(e)=>{e.preventDefault(); navigateTo('/app-config')}} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                          <Settings size={16} /> App Config
                        </a>
                      </div>
                    )}
                    <div className="p-1 border-t">
                      <button onClick={()=>{setIsUserMenuOpen(false); onLogout();}} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;