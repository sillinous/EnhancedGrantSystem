
import React, { useState, useMemo } from 'react';
import { FundingProfile, GrantOpportunity, GroundingSource, GrantStatus, User } from '../types';
import GrantCard from './GrantCard';
import GrantDetailView from './GrantDetailView';
import { CheckSquare } from 'lucide-react';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const statusFilters: GrantStatus[] = ['Interested', 'Applying', 'Submitted', 'Awarded', 'Rejected'];

interface OpportunitiesDashboardProps {
  profile: FundingProfile;
  grants: GrantOpportunity[];
  grantStatuses: Record<string, GrantStatus>;
  onStatusChange: (grant: GrantOpportunity, status: GrantStatus) => Promise<void>;
  sources: GroundingSource[];
  onRefresh: () => void;
  isRefreshing: boolean;
  user: User;
}

const OpportunitiesDashboard: React.FC<OpportunitiesDashboardProps> = ({ profile, grants, grantStatuses, onStatusChange, sources, onRefresh, isRefreshing, user }) => {
  const [selectedGrant, setSelectedGrant] = useState<GrantOpportunity | null>(null);
  const [activeFilter, setActiveFilter] = useState<GrantStatus | 'All'>('All');
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedGrantIds, setSelectedGrantIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<GrantStatus>('Applying');

  const grantsWithStatuses = useMemo(() => {
    return grants.map(grant => ({
      ...grant,
      status: grantStatuses[getGrantId(grant)] || 'Interested' as GrantStatus,
    }));
  }, [grants, grantStatuses]);

  const filteredGrants = useMemo(() => {
    if (activeFilter === 'All') return grantsWithStatuses;
    return grantsWithStatuses.filter(grant => grant.status === activeFilter);
  }, [grantsWithStatuses, activeFilter]);

  const handleSelectGrant = (grant: GrantOpportunity) => {
    if (isSelectMode) return;
    setSelectedGrant(grant);
  };

  const handleCloseDetail = () => {
    setSelectedGrant(null);
  };

  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev);
    setSelectedGrantIds(new Set());
  };

  const handleToggleGrantSelection = (grantId: string) => {
    setSelectedGrantIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(grantId)) {
        newSet.delete(grantId);
      } else {
        newSet.add(grantId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedGrantIds.size === filteredGrants.length) {
      setSelectedGrantIds(new Set()); // Deselect all
    } else {
      const allVisibleIds = new Set(filteredGrants.map(getGrantId));
      setSelectedGrantIds(allVisibleIds);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedGrantIds.size === 0) return;
    
    const grantsToUpdate = grantsWithStatuses.filter(g => selectedGrantIds.has(getGrantId(g)));
    
    const updatePromises = grantsToUpdate.map(grant => {
        return onStatusChange(grant, bulkStatus);
    });

    await Promise.all(updatePromises);

    toggleSelectMode(); // Exit select mode after applying
  };

  const RefreshIcon: React.FC<{isRefreshing: boolean}> = ({ isRefreshing }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`}>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/>
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M3 21v-5h5"/>
    </svg>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className={`w-full lg:w-1/3 transition-all duration-300 ${selectedGrant ? 'hidden lg:block' : 'block'}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Opportunities</h2>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleSelectMode}
                    className="flex items-center text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                >
                    {isSelectMode ? 'Cancel' : <><CheckSquare size={16} className="mr-1.5" /> Bulk Edit</>}
                </button>
                <button 
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="flex items-center text-sm text-primary hover:text-blue-700 disabled:text-gray-400 disabled:cursor-wait transition-colors"
                >
                  <RefreshIcon isRefreshing={isRefreshing} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>
        </div>
        
        <div className="mb-4 overflow-x-auto">
            <div className="flex space-x-2 border-b border-gray-200">
                <button 
                    onClick={() => setActiveFilter('All')} 
                    className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${activeFilter === 'All' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    All ({grantsWithStatuses.length})
                </button>
                {statusFilters.map(status => (
                    <button 
                        key={status} 
                        onClick={() => setActiveFilter(status)}
                        className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${activeFilter === status ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {status} ({grantsWithStatuses.filter(g => g.status === status).length})
                    </button>
                ))}
            </div>
        </div>
        
        {isSelectMode && (
            <div className="mb-4 p-2 border-b">
                <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={filteredGrants.length > 0 && selectedGrantIds.size === filteredGrants.length}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-2"
                        aria-label="Select all visible grants"
                    />
                    Select All ({selectedGrantIds.size} / {filteredGrants.length})
                </label>
            </div>
        )}

        <div className="space-y-4">
          {filteredGrants.length > 0 ? (
            filteredGrants.map((grant) => (
              <GrantCard
                key={getGrantId(grant)}
                grant={grant}
                onSelectForDetail={() => handleSelectGrant(grant)}
                isDetailedView={selectedGrant ? getGrantId(selectedGrant) === getGrantId(grant) : false}
                isSelectMode={isSelectMode}
                isBulkSelected={selectedGrantIds.has(getGrantId(grant))}
                onToggleBulkSelect={() => handleToggleGrantSelection(getGrantId(grant))}
              />
            ))
          ) : (
            <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md border border-gray-200">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-400 mb-4"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              <h3 className="text-lg font-semibold text-gray-700">No Opportunities in this View</h3>
              <p className="text-gray-500 mt-1">
                {activeFilter === 'All' 
                  ? "Our AI couldn't find matching grants for your profile. Try refining your profile."
                  : `You have no grants marked as "${activeFilter}".`}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className={`w-full lg:w-2/3 transition-all duration-300 ${selectedGrant ? 'block' : 'hidden lg:block'}`}>
        <GrantDetailView 
            grant={selectedGrant ? grantsWithStatuses.find(g => getGrantId(g) === getGrantId(selectedGrant!)) || null : null} 
            profile={profile} 
            onClose={handleCloseDetail} 
            sources={sources}
            onStatusChange={onStatusChange}
            user={user}
        />
      </div>
      {isSelectMode && selectedGrantIds.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-40 animate-slide-in-up">
              <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm font-bold text-gray-800">{selectedGrantIds.size} opportunities selected</p>
                  <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Change status to:</span>
                      <select
                          value={bulkStatus}
                          onChange={(e) => setBulkStatus(e.target.value as GrantStatus)}
                          className="appearance-none text-sm font-semibold bg-gray-100 text-gray-800 pl-3 pr-8 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                          {statusFilters.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <button 
                          onClick={handleBulkStatusChange}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors"
                      >
                          Apply
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default OpportunitiesDashboard;
