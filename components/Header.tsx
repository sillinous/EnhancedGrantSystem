import React, { useState, useEffect, useRef } from 'react';
import { User, Team, Notification } from '../types';
import * as teamService from '../services/teamService';
import * as notificationService from '../services/notificationService';
import { LogOut, LayoutDashboard, UserCircle, Search, ChevronDown, Settings, Shield, Users, Star, BookOpen, BrainCircuit, LayoutGrid, Bell, MessageSquare, AlertCircle } from 'lucide-react';
import { useBranding } from '../contexts/BrandingProvider';
import FeedbackModal from './FeedbackModal';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} years ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} months ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} days ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} hours ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} minutes ago`;
    return `${Math.floor(seconds)} seconds ago`;
};


const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamAdminOf, setTeamAdminOf] = useState<Team[]>([]);
  const { branding } = useBranding();
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);


  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{name: string; path: string; icon: React.ReactNode; keywords: string}[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        if (user) {
            try {
                const [allTeams, notifs] = await Promise.all([
                    teamService.getTeamsForUser(user.id),
                    notificationService.getNotifications()
                ]);
                setUserTeams(allTeams);
                const adminTeams = allTeams.filter(team => teamService.hasPermission(user.id, team.id, 'canManageTeam'));
                setTeamAdminOf(adminTeams);
                setNotifications(notifs);
            } catch (error) {
                console.error("Failed to fetch header data:", error);
            }
        }
    };
    fetchData();
  }, [user]);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const handleNotificationClick = async (notification: Notification) => {
      // For now, just navigate. A real app might navigate to the specific grant detail view.
      navigateTo('/pipeline'); 
      if (!notification.isRead) {
          await notificationService.markAsRead(notification.id);
          setNotifications(notifications.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      }
      setIsNotificationMenuOpen(false);
  };
  
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setIsUserMenuOpen(false);
  };

  const searchablePages = user ? [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={16} />, keywords: 'home main overview' },
    { name: 'Pipeline', path: '/pipeline', icon: <LayoutGrid size={16} />, keywords: 'kanban board status' },
    { name: 'Profiles & Search', path: '/app', icon: <Search size={16} />, keywords: 'find grants opportunities' },
    { name: 'Intelligence', path: '/intelligence', icon: <BrainCircuit size={16} />, keywords: 'ai insights trends' },
    { name: 'Pricing', path: '/pricing', icon: <Star size={16} />, keywords: 'upgrade subscription pro plan' },
    { name: 'Resources', path: '/resources', icon: <BookOpen size={16} />, keywords: 'help docs articles' },
    { name: 'Account', path: '/account', icon: <UserCircle size={16} />, keywords: 'settings profile subscription' },
    ...(user.role === 'Admin' ? [
        { name: 'Super Admin', path: '/super-admin', icon: <Shield size={16} />, keywords: 'users management impersonate' },
        { name: 'App Config', path: '/app-config', icon: <Settings size={16} />, keywords: 'monetization model' }
    ] : []),
    ...teamAdminOf.map(team => ({ name: `${team.name} Hub`, path: `/team-hub/${team.id}`, icon: <Users size={16} />, keywords: `organization team members ${team.name}` })),
  ] : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
        const lowerCaseQuery = query.toLowerCase();
        const results = searchablePages.filter(page =>
            page.name.toLowerCase().includes(lowerCaseQuery) ||
            page.keywords.toLowerCase().includes(lowerCaseQuery)
        );
        setSearchResults(results);
        setIsSearchOpen(true);
    } else {
        setSearchResults([]);
        setIsSearchOpen(false);
    }
  };

  const handleResultClick = (path: string) => {
      navigateTo(path);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchOpen(false);
  };
  
   useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfilesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo('/app');
  };
  
  return (
    <>
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo(user ? '/dashboard' : '/'); }} className="flex items-center cursor-pointer flex-shrink-0">
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
            {user && (
              <div className="relative hidden md:block" ref={searchRef}>
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                      type="text"
                      placeholder="Search & Navigate..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery.trim().length > 0 && setIsSearchOpen(true)}
                      className="w-72 bg-gray-100 border border-transparent rounded-lg pl-10 pr-4 py-2 text-sm focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      aria-label="Search navigation"
                  />
                  {isSearchOpen && searchResults.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border z-30 animate-fade-in">
                          <ul className="p-1 max-h-80 overflow-y-auto">
                              {searchResults.map(result => (
                                  <li key={result.path}>
                                      <button
                                          onClick={() => handleResultClick(result.path)}
                                          className="w-full flex items-center gap-3 text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                      >
                                          <span className="text-gray-500">{result.icon}</span>
                                          {result.name}
                                      </button>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>
            )}
          </div>
          
          {!user ? (
             <div className="flex items-center gap-2">
                 <a href="/resources" onClick={(e) => { e.preventDefault(); navigateTo('/resources'); }} className="text-sm font-medium text-gray-600 hover:text-primary">Resources</a>
                 <a href="/pricing" onClick={(e) => { e.preventDefault(); navigateTo('/pricing'); }} className="text-sm font-medium text-gray-600 hover:text-primary">Pricing</a>
                 <button onClick={() => navigateTo('/login')} className="px-4 py-2 text-sm font-medium text-primary rounded-md hover:bg-primary/10 transition-colors">Sign In</button>
                 <button onClick={() => navigateTo('/login')} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors">Sign Up</button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <nav className="hidden xl:flex items-center gap-6">
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

              <div className="h-6 w-px bg-gray-200 hidden xl:block"></div>
              
                {/* Notification Bell */}
              <div className="relative" ref={notificationRef}>
                  <button onClick={() => setIsNotificationMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary transition-colors">
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                              {unreadCount}
                          </span>
                      )}
                  </button>
                  {isNotificationMenuOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-20 animate-fade-in">
                          <div className="p-3 border-b font-bold text-gray-700">Notifications</div>
                          <ul className="max-h-80 overflow-y-auto">
                              {notifications.length > 0 ? notifications.map(notif => (
                                  <li key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                                      <p className="text-sm font-semibold">{notif.grantName}</p>
                                      <p className="text-xs text-gray-600">{notif.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                  </li>
                              )) : (
                                  <li className="p-4 text-sm text-center text-gray-500">No new notifications.</li>
                              )}
                          </ul>
                      </div>
                  )}
              </div>

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
                    <div className="p-2 border-b xl:hidden">
                        <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigateTo('/dashboard'); }} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                            <LayoutDashboard size={16} /> Dashboard
                        </a>
                         <a href="/pipeline" onClick={(e) => { e.preventDefault(); navigateTo('/pipeline'); }} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                            <LayoutGrid size={16} /> Pipeline
                        </a>
                        <a href="/app" onClick={(e) => {e.preventDefault(); navigateTo('/app')}} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                            <Search size={16} /> Profiles & Search
                        </a>
                        <a href="/intelligence" onClick={(e) => { e.preventDefault(); navigateTo('/intelligence'); }} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                            <BrainCircuit size={16} /> Intelligence
                        </a>
                         <a href="/pricing" onClick={(e) => { e.preventDefault(); navigateTo('/pricing'); }} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                            <Star size={16} /> Pricing
                        </a>
                        <a href="/resources" onClick={(e) => { e.preventDefault(); navigateTo('/resources'); }} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                            <BookOpen size={16} /> Resources
                        </a>
                    </div>
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
                      <button onClick={() => { setIsUserMenuOpen(false); setIsFeedbackModalOpen(true); }} className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                        <MessageSquare size={16} /> Provide Feedback
                      </button>
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
    <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
    </>
  );
};

export default Header;