import React, { useState, useEffect, useMemo } from 'react';
import { User, GrantOpportunity, GrantStatus, PipelineStats } from '../types';
import Header from './Header';
import LoadingSpinner from './LoadingSpinner';
import * as trackedGrantService from '../services/trackedGrantService';
import * as grantStatusService from '../services/grantStatusService';
import * as pipelineService from '../services/pipelineService';
import * as csvExportService from '../services/csvExportService';
import { DollarSign, Award, Target, Download } from 'lucide-react';

interface PipelineDashboardProps {
  user: User;
  onLogout: () => void;
}

const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const statusColumns: GrantStatus[] = ['Interested', 'Applying', 'Submitted', 'Awarded', 'Rejected'];

const statusStyles: Record<GrantStatus, { bg: string, text: string }> = {
  Interested: { bg: 'bg-gray-100', text: 'text-gray-800' },
  Applying: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Submitted: { bg: 'bg-purple-100', text: 'text-purple-800' },
  Awarded: { bg: 'bg-green-100', text: 'text-green-800' },
  Rejected: { bg: 'bg-red-100', text: 'text-red-800' },
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
        const trackedGrants = trackedGrantService.getTrackedGrants();
        const allStatuses = grantStatusService.getAllGrantStatuses();
        
        const grantsWithStatuses = trackedGrants.map(grant => ({
            ...grant,
            status: allStatuses[getGrantId(grant)] || 'Interested' as GrantStatus,
        }));
        
        setGrants(grantsWithStatuses);
        setStats(pipelineService.calculatePipelineStats(trackedGrants, allStatuses));
        setIsLoading(false);
    }, []);

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
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={onLogout} />
            <main className="container mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Grant Pipeline</h1>
                        <p className="text-gray-600 mt-1">Executive overview of your team's funding efforts.</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="mt-4 md:mt-0 flex items-center text-sm font-medium text-white bg-primary px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download size={16} className="mr-2" />
                        Export as CSV
                    </button>
                </div>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <StatCard title="Total Pipeline" value={`$${stats.totalPipeline.toLocaleString()}`} icon={<DollarSign size={24} />} />
                        <StatCard title="Awarded (YTD)" value={`$${stats.totalAwardedYTD.toLocaleString()}`} icon={<Award size={24} />} />
                        <StatCard title="Success Rate" value={`${stats.successRate.toFixed(1)}%`} icon={<Target size={24} />} />
                    </div>
                )}

                <div className="flex gap-4 overflow-x-auto pb-4">
                    {statusColumns.map(status => (
                        <div key={status} className="w-72 flex-shrink-0 bg-gray-100 rounded-lg">
                            <div className="p-3 border-b-2 border-gray-200">
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
            </main>
        </div>
    );
};

export default PipelineDashboard;
