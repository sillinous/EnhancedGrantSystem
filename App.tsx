import React, { useState } from 'react';
import { BrandingProvider } from './contexts/BrandingProvider';
import { ToastProvider } from './contexts/ToastProvider';
import ToastContainer from './components/Toast';
import Dashboard from './components/Dashboard';
import MainApp from './components/MainApp';
import IntelligencePlatform from './components/IntelligencePlatform';
import PipelineDashboard from './components/PipelineDashboard';
import LandingPage from './components/LandingPage';
import PricingPage from './components/PricingPage';
import ResourceCenter from './components/ResourceCenter';
import { mockUser } from './services/store';

const App: React.FC = () => {
  const [location, setLocation] = useState(window.location.pathname);

  React.useEffect(() => {
    const onNav = () => setLocation(window.location.pathname);
    const orig = window.history.pushState;
    window.history.pushState = function(...args) { orig.apply(this, args); onNav(); };
    window.addEventListener('popstate', onNav);
    return () => { window.removeEventListener('popstate', onNav); window.history.pushState = orig; };
  }, []);

  const user = mockUser;
  const onLogout = () => { window.history.pushState({}, '', '/'); setLocation('/'); };
  const onSubscriptionChange = () => {};

  return (
    <BrandingProvider>
      <ToastProvider>
        <ToastContainer />
        {location === '/' && <LandingPage />}
        {location === '/pricing' && <PricingPage user={user} onSubscriptionSuccess={onSubscriptionChange} />}
        {location === '/resources' && <ResourceCenter />}
        {location === '/dashboard' && <Dashboard user={user} onLogout={onLogout} />}
        {location === '/app' && <MainApp user={user} onLogout={onLogout} onSubscriptionChange={onSubscriptionChange} />}
        {location === '/intelligence' && <IntelligencePlatform user={user} onLogout={onLogout} />}
        {location === '/pipeline' && <PipelineDashboard user={user} onLogout={onLogout} />}
        {!['/','  /pricing','/resources','/dashboard','/app','/intelligence','/pipeline'].includes(location) && <Dashboard user={user} onLogout={onLogout} />}
      </ToastProvider>
    </BrandingProvider>
  );
};

export default App;
