import React from 'react';
import { User } from '../types';
import { LogOut, LayoutDashboard, UserCircle } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onReset?: () => void;
  showReset?: boolean;
  onToggleAdminView?: () => void;
  isAdminView?: boolean;
  isPublic: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onReset, showReset, onToggleAdminView, isAdminView, isPublic }) => {
  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" onClick={(e) => { e.preventDefault(); navigateTo(user ? '/app' : '/'); }} className="flex items-center cursor-pointer">
             <div className="bg-primary p-2 rounded-lg mr-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
             </div>
            <h1 className="text-xl font-bold text-primary">GrantFinder AI</h1>
          </a>
          
          {isPublic ? (
             <div className="flex items-center gap-2">
                 <a href="/resources" onClick={(e) => { e.preventDefault(); navigateTo('/resources'); }} className="text-sm font-medium text-gray-600 hover:text-primary">Resource Center</a>
                 <button onClick={() => navigateTo('/login')} className="px-4 py-2 text-sm font-medium text-primary rounded-md hover:bg-primary/10 transition-colors">Sign In</button>
                 <button onClick={() => navigateTo('/login')} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors">Sign Up</button>
            </div>
          ) : user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-sm font-medium text-gray-700">{user.username}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-2 ${user.isSubscribed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                  {user.isSubscribed ? 'Pro' : 'Free'}
                </span>
              </div>
              <button onClick={() => navigateTo('/account')} className="flex items-center text-sm text-gray-600 hover:text-primary" title="Manage Account">
                 <UserCircle size={20} />
              </button>
               {user.role === 'Admin' && onToggleAdminView && (
                  <button 
                    onClick={onToggleAdminView} 
                    className={`flex items-center text-sm font-medium transition-colors ${isAdminView ? 'text-white bg-primary' : 'text-primary bg-primary/10 hover:bg-primary/20'} px-3 py-1.5 rounded-md`}
                  >
                    <LayoutDashboard size={16} className="mr-1.5" />
                    Admin
                  </button>
              )}
              {showReset && !isAdminView && onReset && (
                <button
                  onClick={onReset}
                  className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" x2="12" y1="18" y2="12"></line><line x1="9" x2="15" y1="15" y2="15"></line></svg>
                  New Search
                </button>
              )}
              <button
                onClick={onLogout}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;