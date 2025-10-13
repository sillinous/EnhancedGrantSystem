import React, { useState, useEffect, useMemo } from 'react';
import { User, GrantOpportunity, GrantStatus, PipelineStats } from '../types';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import * as trackedGrantService from '../services/trackedGrantService';
import * as grantStatusService from '../services/grantStatusService';
import * as pipelineService from '../services/pipelineService';
import * as csvExportService from '../services/csvExportService';
import { DollarSign, Award, Target, Download, PlusCircle } from 'lucide-react';

interface PipelineDashboardProps {
  user: User;
  onLogout: () => void;
}

const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const statusColumns: GrantStatus[] = ['Interested', 'Applying', 'Submitted', 'Awarded', 'Rejected'];

const statusStyles: Record<GrantStatus, { bg: string, text: string, border: string }> = {
  Interested: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  Applying: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  Submitted: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  Awarded: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const StatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 flex items-center">
        <div className="p-3 bg-primary/10 text-primary rounded-lg">{icon}</div>
        <div className="ml-4">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-xl font-bold">{value}</p>
        </div>
    </div>
);


const PipelineDashboard: React.FC<PipelineDashboardProps> = ({ user, onLogout }) => {
    const [grants, setGrants] = useState<(GrantOpportunity & { status: GrantStatus })[]>([]);
    const [stats, setStats] = useState<PipelineStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const trackedGrants = await trackedGrantService.getTrackedGrants();
                const allStatuses = await grantStatusService.getAllGrantStatuses();
                
                const grantsWithStatuses = trackedGrants.map(grant => ({
                    ...grant,
                    status: allStatuses[getGrantId(grant)] || 'Interested' as GrantStatus,
                }));
                
                setGrants(grantsWithStatuses);
                setStats(pipelineService.calculatePipelineStats(trackedGrants, allStatuses));
            } catch (error) {
                console.error("Failed to load pipeline data", error);
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

    const grantsByStatus = useMemo(() => {
        const grouped: Record<GrantStatus, (GrantOpportunity & { status: GrantStatus })[]> = {
            Interested: [], Applying: [], Submitted: [], Awarded: [], Rejected: []
        };
        grants.forEach(grant => {
            grouped[grant.status].push(grant);
        });
        return grouped;
    }, [grants]);

    const handleExport = () => {
        csvExportService.exportGrantsToCSV(grants);
    };

    if (isLoading) {
        return (
             <div className="min-h-screen bg-gray-50">
                <Header user={user} onLogout={onLogout} />
                <main className="container mx-auto p-4 md:p-8">
                     <LoadingSpinner message="Loading pipeline data..." />
                </main>
             </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={onLogout} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Grant Pipeline</h1>
                        <p className="text-gray-600 mt-1">Manage and track your grant applications from start to finish.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={grants.length === 0}
                        className="mt-4 md:mt-0 flex items-center text-sm font-medium text-white bg-primary px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Download size={16} className="mr-2" />
                        Export as CSV
                    </button>
                </div>

                {stats && grants.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Total Pipeline" value={`$${stats.totalPipeline.toLocaleString()}`} icon={<DollarSign size={24} />} />
                        <StatCard title="Awarded (YTD)" value={`$${stats.totalAwardedYTD.toLocaleString()}`} icon={<Award size={24} />} />
                        <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={<Target size={24} />} />
                    </div>
                )}
                
                {grants.length === 0 ? (
                     <div className="text-center bg-white p-12 rounded-xl shadow-lg border border-gray-200">
                        <Target size={40} className="mx-auto text-primary mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800">Your Pipeline is Empty</h2>
                        <p className="text-gray-600 mt-2">Start by finding grants and adding them to your pipeline to track their status here.</p>
                        <button onClick={() => navigateTo('/app')} className="mt-6 flex items-center justify-center mx-auto text-sm font-medium text-white bg-primary px-5 py-2.5 rounded-full hover:bg-blue-700 transition-colors">
                            <PlusCircle size={16} className="mr-2" />
                            Find Your First Grant
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {statusColumns.map(status => (
                            <div key={status} className="w-72 flex-shrink-0 bg-gray-100 rounded-lg">
                                <div className={`p-3 border-b-4 ${statusStyles[status].border}`}>
                                    <h2 className={`font-semibold text-sm ${statusStyles[status].text}`}>
                                        {status} ({grantsByStatus[status].length})
                                    </h2>
                                </div>
                                <div className="p-2 space-y-2 h-full">
                                    {grantsByStatus[status].length > 0 ? (
                                        grantsByStatus[status].map(grant => (
                                            <div key={getGrantId(grant)} className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                                <p className="text-sm font-semibold text-gray-800 line-clamp-2">{grant.name}</p>
                                                <p className={`mt-2 text-xs font-bold px-2 py-0.5 rounded-full inline-block ${statusStyles[status].bg} ${statusStyles[status].text}`}>
                                                    {grant.fundingAmount}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-xs text-gray-500">No grants in this stage.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default PipelineDashboard;