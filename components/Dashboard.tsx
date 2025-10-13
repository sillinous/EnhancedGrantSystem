import React, { useState, useEffect } from 'react';
import { User, GrantOpportunity, ChecklistItem, GrantStatus, Notification } from '../types';
import Header from './Header';
import OnboardingModal from './OnboardingModal';
import * as trackedGrantService from '../services/trackedGrantService';
import * as grantStatusService from '../services/grantStatusService';
import * as checklistService from '../services/checklistService';
import * as profileService from '../services/profileService';
import * as notificationService from '../services/notificationService';
import { Calendar, Edit, Zap, Clock, ChevronRight, PlusCircle, Bell } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface DeadlineItem extends ChecklistItem {
    grantName: string;
}

const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const aiTips = [
    "Did you know? Funders often prefer budgets that clearly link each expense to a specific project outcome. Use the Budget Assistant to generate strong justifications.",
    "Try running the 'Funder Persona' analysis on a new grant. Understanding a funder's priorities can give you a significant edge in your proposal.",
    "Before submitting, always use the 'Cohesion Analyzer'. It catches inconsistencies between your drafts that are easy to miss but crucial for a professional impression.",
    "Keep your Document Library up to date. Having your key documents ready makes the application process much faster and smoother."
];

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [inProgressGrants, setInProgressGrants] = useState<GrantOpportunity[]>([]);
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([]);
    const [newOpportunities, setNewOpportunities] = useState<Notification[]>([]);
    const [currentAiTip, setCurrentAiTip] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);
    const [isOboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    trackedGrants, 
                    allStatuses, 
                    profiles,
                    notifications
                ] = await Promise.all([
                    trackedGrantService.getTrackedGrants(),
                    grantStatusService.getAllGrantStatuses(),
                    profileService.getProfiles(),
                    notificationService.getNotifications()
                ]);

                if (profiles.length === 0) {
                    setIsNewUser(true);
                    setIsOnboardingModalOpen(true);
                }
                
                const applyingGrants = trackedGrants.filter(grant => allStatuses[getGrantId(grant)] === 'Applying');
                setInProgressGrants(applyingGrants);

                const deadlinePromises = trackedGrants.map(async (grant) => {
                    const checklist = await checklistService.getChecklist(getGrantId(grant));
                    return checklist
                        .filter(item => item.dueDate && !item.completed)
                        .map(item => ({ ...item, grantName: grant.name }));
                });

                const nestedDeadlines = await Promise.all(deadlinePromises);
                const deadlines = nestedDeadlines.flat();
                deadlines.sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
                setUpcomingDeadlines(deadlines.slice(0, 5));
                
                setNewOpportunities(notifications.filter(n => !n.isRead).slice(0, 5));
                setCurrentAiTip(aiTips[Math.floor(Math.random() * aiTips.length)]);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const navigateTo = (path: string) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const Widget: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="flex items-center text-primary mb-4">
                {icon}
                <h3 className="text-lg font-bold ml-3">{title}</h3>
            </div>
            <div className="flex-grow">{children}</div>
        </div>
    );
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                 <Header user={user} onLogout={onLogout} />
                 <main className="container mx-auto p-4 md:p-8">
                    <LoadingSpinner message="Loading your dashboard..." />
                 </main>
            </div>
        )
    }
    
    if (isNewUser) {
        return (
            <div className="min-h-screen bg-gray-50">
                 <Header user={user} onLogout={onLogout} />
                 <main className="container mx-auto p-4 md:p-8 text-center">
                    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border">
                        <Zap size={40} className="mx-auto text-primary mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Welcome to GrantFinder AI!</h2>
                        <p className="text-gray-600 mt-2">Let's find the perfect funding for your project. Create a profile to get started.</p>
                        <button onClick={() => navigateTo('/app')} className="mt-6 w-full flex items-center justify-center text-sm font-medium text-white bg-primary px-4 py-3 rounded-full hover:bg-blue-700 transition-colors">
                            <PlusCircle size={16} className="mr-2" />
                            Create Your First Funding Profile
                        </button>
                    </div>
                 </main>
                 <OnboardingModal isOpen={isOboardingModalOpen} onClose={() => setIsOnboardingModalOpen(false)} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={onLogout} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Mission Control</h1>
                    <p className="text-gray-600 mt-1">Welcome back, {user.username.split('@')[0]}. Here's your grant-seeking overview.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* New Opportunities */}
                    <Widget title="New Opportunities" icon={<Bell size={24} />}>
                           {newOpportunities.length > 0 ? (
                                <ul className="space-y-3">
                                    {newOpportunities.map(notif => (
                                        <li key={notif.id} className="p-3 border rounded-lg group hover:border-primary/50 transition-colors">
                                           <p className="font-semibold text-gray-800 text-sm">{notif.grantName}</p>
                                           <p className="text-xs text-gray-500">{notif.message}</p>
                                        </li>
                                    ))}
                                </ul>
                           ) : (
                                <div className="text-center text-gray-500 py-8 h-full flex flex-col justify-center items-center">
                                    <p className="mb-2 text-sm">Your AI Scouts are working. New opportunities will appear here.</p>
                                </div>
                           )}
                    </Widget>
                    
                     {/* In-Progress Applications */}
                    <Widget title="In-Progress Applications" icon={<Edit size={24} />}>
                           {inProgressGrants.length > 0 ? (
                                <ul className="space-y-3">
                                    {inProgressGrants.map(grant => (
                                        <li key={getGrantId(grant)} className="p-3 border rounded-lg flex justify-between items-center group hover:border-primary/50 transition-colors">
                                            <div>
                                                <p className="font-semibold text-gray-800">{grant.name}</p>
                                                <p className="text-sm text-gray-500">{grant.fundingAmount}</p>
                                            </div>
                                            <button onClick={() => navigateTo('/pipeline')} className="text-sm font-medium text-primary hover:underline flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                View <ChevronRight size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                           ) : (
                                <div className="text-center text-gray-500 py-8 h-full flex flex-col justify-center items-center">
                                    <p className="mb-4">You have no applications in progress.</p>
                                    <button onClick={() => navigateTo('/app')} className="flex items-center text-sm font-medium text-white bg-primary px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
                                        <PlusCircle size={16} className="mr-2" />
                                        Start a New Search
                                    </button>
                                </div>
                           )}
                    </Widget>

                    {/* AI Tip of the Day */}
                    <Widget title="AI Strategy Tip" icon={<Zap size={24} />}>
                       <div className="bg-yellow-50 text-yellow-900 p-4 rounded-lg border border-yellow-200 h-full">
                           <p className="text-sm">{currentAiTip}</p>
                       </div>
                    </Widget>

                    {/* Upcoming Deadlines */}
                     <div className="lg:col-span-3">
                        <Widget title="Upcoming Deadlines" icon={<Calendar size={24} />}>
                            {upcomingDeadlines.length > 0 ? (
                                <ul className="space-y-3">
                                {upcomingDeadlines.map(item => (
                                    <li key={item.id} className="p-3 border rounded-lg flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center p-2 rounded-md bg-red-50 text-red-700 w-16 flex-shrink-0">
                                            <span className="text-xs font-bold uppercase">{new Date(item.dueDate!).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</span>
                                            <span className="text-2xl font-bold">{new Date(item.dueDate!).getUTCDate()}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.text}</p>
                                            <p className="text-sm text-gray-500">{item.grantName}</p>
                                        </div>
                                    </li>
                                ))}
                                </ul>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    <Clock size={32} className="mx-auto mb-2 opacity-50"/>
                                    <p>No upcoming deadlines found in your checklists.</p>
                                    <p className="text-xs mt-1">Add due dates to your checklist items to see them here.</p>
                                </div>
                            )}
                        </Widget>
                    </div>
                </div>
            </main>
            <OnboardingModal isOpen={isOboardingModalOpen} onClose={() => setIsOnboardingModalOpen(false)} />
        </div>
    );
};

export default Dashboard;