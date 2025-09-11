import React, { useState, useEffect, useCallback } from 'react';
import { User, FundingProfile, GrantOpportunity, GroundingSource, GrantStatus, Team } from '../types';
import * as profileService from '../services/profileService';
import * as teamService from '../services/teamService';
import * as geminiService from '../services/geminiService';
import * as grantStatusService from '../services/grantStatusService';
import * as trackedGrantService from '../services/trackedGrantService';
import Header from './Header';
import ProfileSelection from './ProfileSelection';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import Modal from './Modal';
import TeamManager from './TeamManager';
import { ArrowLeft } from 'lucide-react';

interface MainAppProps {
  user: User;
  onLogout: () => void;
  // This prop is passed down from App.tsx but not used here, included for type consistency
  onSubscriptionChange: (user: User) => void;
}

const getGrantId = (grant: GrantOpportunity): string => {
    return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [profiles, setProfiles] = useState<FundingProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<FundingProfile | null>(null);
  const [grants, setGrants] = useState<GrantOpportunity[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [grantStatuses, setGrantStatuses] = useState<Record<string, GrantStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<FundingProfile | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);


  const loadData = useCallback(() => {
    setIsLoading(true);
    setProfiles(profileService.getProfiles());
    setTeams(teamService.getTeamsForUser(user.id));
    setGrantStatuses(grantStatusService.getAllGrantStatuses());
    setIsLoading(false);
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleProfileSelect = async (profile: FundingProfile) => {
    setIsSearching(true);
    setError(null);
    setSelectedProfile(profile);
    try {
      const result = await geminiService.findGrants(profile);
      setGrants(result.opportunities);
      setSources(result.sources);
      // Track all found grants so they appear in the pipeline
      result.opportunities.forEach(grant => trackedGrantService.addTrackedGrant(grant));
    } catch (e) {
      console.error(e);
      setError("The AI couldn't find grants for this profile. The service may be busy. Please try again later.");
      setSelectedProfile(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateOrUpdateProfile = (profileData: Omit<FundingProfile, 'id' | 'owner'>, id?: number) => {
    const allProfiles = profileService.getProfiles();
    let profileToSearch: FundingProfile | null = null;
    
    if (id) { // Update
      const existingProfile = allProfiles.find(p => p.id === id);
      if(!existingProfile) return;
      
      const updatedProfile = { ...existingProfile, ...profileData };
      const updatedProfiles = allProfiles.map(p => p.id === id ? updatedProfile : p);
      profileService.saveProfiles(updatedProfiles);
      profileToSearch = updatedProfile;

    } else { // Create
      const owner = profileData.profileType === 'Individual' 
        ? { type: 'user' as const, id: user.id } 
        : { type: 'team' as const, id: user.teamIds[0] };
      
      if(owner.type === 'team' && !owner.id) {
          alert("You must be part of a team to create a Business or Non-Profit profile.");
          return;
      }

      const newProfile: FundingProfile = { ...profileData, id: Date.now(), owner };
      profileService.saveProfiles([...allProfiles, newProfile]);
    }
    
    setProfileToEdit(null);
    loadData();

    if (profileToSearch) {
        handleProfileSelect(profileToSearch);
    }
  };
  
  const handleDeleteProfile = (profileId: number) => {
    if (window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
        const updatedProfiles = profiles.filter(p => p.id !== profileId);
        profileService.saveProfiles(updatedProfiles);
        loadData();
    }
  };
  
  const handleStatusChange = (grant: GrantOpportunity, status: GrantStatus) => {
      const grantId = getGrantId(grant);
      grantStatusService.saveGrantStatus(grantId, status);
      setGrantStatuses(grantStatusService.getAllGrantStatuses());
  };

  const handleRefreshSearch = () => {
      if (selectedProfile) {
          handleProfileSelect(selectedProfile);
      }
  };

  const handleCreateTeam = (teamName: string) => {
    teamService.createTeam(teamName, user.id);
    setTeams(teamService.getTeamsForUser(user.id));
    setIsTeamManagerOpen(false);
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="mt-20"><LoadingSpinner message="Loading your profiles..." /></div>;
    }

    if (error) {
        return <div className="mt-10"><ErrorDisplay message={error} /></div>;
    }

    if (selectedProfile) {
      return (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                  setSelectedProfile(null);
                  setGrants([]);
                  setSources([]);
              }}
              className="flex items-center text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back to Profiles
            </button>
            <div className="text-right">
                <p className="text-sm text-gray-500">Showing results for:</p>
                <p className="font-bold text-gray-800">{selectedProfile.name}</p>
            </div>
          </div>
          {isSearching ? (
             <LoadingSpinner message={`AI is searching for grants matching "${selectedProfile.name}"...`} />
          ) : (
             <OpportunitiesDashboard
                profile={selectedProfile}
                grants={grants}
                grantStatuses={grantStatuses}
                onStatusChange={handleStatusChange}
                sources={sources}
                onRefresh={handleRefreshSearch}
                isRefreshing={isSearching}
                user={user}
             />
          )}
        </div>
      );
    }

    return (
      <ProfileSelection
        user={user}
        teams={teams}
        profiles={profiles}
        onSelect={handleProfileSelect}
        onCreateOrUpdate={handleCreateOrUpdateProfile}
        onDelete={handleDeleteProfile}
        isLoading={isSearching}
        onEdit={(profile) => {
            setProfileToEdit(profile);
            const formElement = document.getElementById('profile-form-section');
            formElement?.scrollIntoView({ behavior: 'smooth' });
        }}
        onCancelEdit={() => setProfileToEdit(null)}
        profileToEdit={profileToEdit}
        onOpenTeamManager={() => setIsTeamManagerOpen(true)}
      />
    );
  };

  return (
    <>
      <Header user={user} onLogout={onLogout} />
      <main className="container mx-auto p-4 md:p-8">
        {renderContent()}
      </main>
      <Modal isOpen={isTeamManagerOpen} onClose={() => setIsTeamManagerOpen(false)} title="Create a New Team">
        <TeamManager onCreateTeam={handleCreateTeam} />
      </Modal>
    </>
  );
};

export default MainApp;
