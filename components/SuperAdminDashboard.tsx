import React, { useState, useEffect } from 'react';
import { User, SuperAdminStats, Subscription } from '../types';
import Header from './Header';
import * as authService from '../services/authService';
import * as subscriptionService from '../services/subscriptionService';
import * as teamService from '../services/teamService';
import { Users, CreditCard, BarChart2, Eye } from 'lucide-react';

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const UserManagementPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    
    useEffect(() => {
        setUsers(authService.getAllUsers());
    }, []);

    const handleImpersonate = (userId: number) => {
        if (authService.impersonate(userId)) {
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-bold mb-4">User Management</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2">Username</th>
                            <th className="p-2">Role</th>
                            <th className="p-2">Subscription</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b">
                                <td className="p-2 font-medium">{u.username}</td>
                                <td className="p-2">{u.role}</td>
                                <td className="p-2">{u.isSubscribed ? 'Pro' : 'Free'}</td>
                                <td className="p-2">
                                    <button 
                                        onClick={() => handleImpersonate(u.id)}
                                        className="flex items-center text-xs text-primary hover:underline"
                                    >
                                        <Eye size={14} className="mr-1"/> Impersonate
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout }) => {
    const [stats, setStats] = useState<SuperAdminStats>({ totalUsers: 0, activeSubscriptions: 0, totalTeams: 0 });

    useEffect(() => {
        const allUsers = authService.getAllUsers();
        const allSubs = Object.values(subscriptionService.getAllSubscriptions());
        const allTeams = teamService.getAllTeams();

        setStats({
            totalUsers: allUsers.length,
            // FIX: Add type annotation to `s` to resolve properties on type `unknown`.
            activeSubscriptions: allSubs.filter((s: Subscription) => s.plan === 'Pro' && s.status === 'active').length,
            totalTeams: allTeams.length
        });
    }, []);

    const StatCard: React.FC<{ title: string, value: number, icon: React.ReactNode }> = ({ title, value, icon }) => (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex items-center">
            <div className="p-3 bg-primary/10 text-primary rounded-lg">{icon}</div>
            <div className="ml-4">
                <p className="text-gray-600">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={onLogout} isPublic={false} />
            <main className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Super Admin Dashboard</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Users" value={stats.totalUsers} icon={<Users size={24} />} />
                    <StatCard title="Active Subscriptions" value={stats.activeSubscriptions} icon={<CreditCard size={24} />} />
                    <StatCard title="Total Teams" value={stats.totalTeams} icon={<BarChart2 size={24} />} />
                </div>

                <UserManagementPanel />
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
