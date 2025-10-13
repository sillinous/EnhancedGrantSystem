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
import Modal from './Modal';
import TeamManager from './TeamManager';
import { useToast } from '../hooks/useToast';
import { ArrowLeft } from 'lucide-react';

interface MainAppProps {
  user: User;
  onLogout: () => void;
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
  const [isSaving, setIsSaving] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<FundingProfile | null>(null);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const { showToast } = useToast();


  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const [userProfiles, userTeams, allStatuses] = await Promise.all([
            profileService.getProfiles(),
            teamService.getTeamsForUser(user.id),
            grantStatusService.getAllGrantStatuses()
        ]);
        setProfiles(userProfiles);
        setTeams(userTeams);
        setGrantStatuses(allStatuses);
    } catch (err) {
        console.error(err);
        showToast("Failed to load your data. Please try refreshing the page.", 'error');
    } finally {
        setIsLoading(false);
    }
  }, [user.id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleProfileSelect = async (profile: FundingProfile) => {
    setIsSearching(true);
    setSelectedProfile(profile);
    try {
      const result = await geminiService.findGrants(profile);
      setGrants(result.opportunities);
      setSources(result.sources);
      // Track all found grants so they appear in the pipeline
      const addPromises = result.opportunities.map(grant => trackedGrantService.addTrackedGrant(grant));
      await Promise.all(addPromises);
    } catch (e) {
      console.error(e);
      showToast("The AI couldn't find grants for this profile. The service may be busy. Please try again later.", 'error');
      setSelectedProfile(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateOrUpdateProfile = async (profileData: Omit<FundingProfile, 'id' | 'owner'>, id?: number) => {
    setIsSaving(true);
    
    let profileToSearch: FundingProfile | null = null;

    try {
        if (id) { // Update
            const existingProfile = profiles.find(p => p.id === id);
            if (!existingProfile) throw new Error("Profile not found");
            const updatedProfile = { ...existingProfile, ...profileData };
            profileToSearch = await profileService.updateProfile(updatedProfile);
            showToast('Profile updated successfully!', 'success');
        } else { // Create
            const newProfile = await profileService.addProfile(profileData);
            profileToSearch = newProfile;
            showToast('Profile created successfully! The AI is now searching for grants.', 'success');
        }
    } catch (err) {
        showToast("Failed to save the profile. Please try again.", 'error');
        console.error(err);
    } finally {
        setProfileToEdit(null);
        await loadData();
        setIsSaving(false);

        if (profileToSearch) {
            await handleProfileSelect(profileToSearch);
        }
    }
  };
  
  const handleDeleteProfile = async (profileId: number) => {
    if (window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) {
        try {
            await profileService.deleteProfile(profileId);
            await loadData();
            showToast('Profile deleted.', 'success');
        } catch (err) {
            showToast("Failed to delete profile.", 'error');
            console.error(err);
        }
    }
  };
  
  const handleStatusChange = async (grant: GrantOpportunity, status: GrantStatus) => {
      const grantId = getGrantId(grant);
      const originalStatuses = { ...grantStatuses };
      setGrantStatuses(prev => ({...prev, [grantId]: status}));
      try {
          await grantStatusService.saveGrantStatus(grantId, status);
      } catch (e) {
          console.error("Failed to update status on server:", e);
          setGrantStatuses(originalStatuses);
          showToast("Failed to update grant status. Please try again.", 'error');
      }
  };

  const handleRefreshSearch = () => {
      if (selectedProfile) {
          handleProfileSelect(selectedProfile);
      }
  };

  const handleCreateTeam = async (teamName: string) => {
    try {
      await teamService.createTeam(teamName, user.id);
      setTeams(await teamService.getTeamsForUser(user.id));
      setIsTeamManagerOpen(false);
      showToast(`Team "${teamName}" created!`, 'success');
    } catch (error) {
        showToast('Failed to create team. Please try again.', 'error');
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return <div className="mt-20"><LoadingSpinner message="Loading your profiles..." /></div>;
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
        isLoading={isSaving || isSearching}
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