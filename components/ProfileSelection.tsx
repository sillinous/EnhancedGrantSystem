
import React from 'react';
import { FundingProfile, User, Team } from '../types';
import ProfileForm from './ProfileForm';
import { Pencil, Trash2, User as UserIcon, Building, HeartHandshake, Users, Plus } from 'lucide-react';

interface ProfileSelectionProps {
  user: User;
  teams: Team[];
  profiles: FundingProfile[];
  onCreateOrUpdate: (profile: Omit<FundingProfile, 'id'>, id?: number) => void;
  onSelect: (profile: FundingProfile) => void;
  onDelete: (profileId: number) => void;
  isLoading: boolean;
  onEdit: (profile: FundingProfile) => void;
  onCancelEdit: () => void;
  profileToEdit: FundingProfile | null;
  onOpenTeamManager: () => void;
}

const ProfileTypeIcon: React.FC<{ type: FundingProfile['profileType'] }> = ({ type }) => {
    switch (type) {
        case 'Individual': return <UserIcon size={16} className="text-gray-500" />;
        case 'Business': return <Building size={16} className="text-gray-500" />;
        case 'Non-Profit': return <HeartHandshake size={16} className="text-gray-500" />;
        default: return null;
    }
};

const ProfileSelection: React.FC<ProfileSelectionProps> = ({ user, teams, profiles, onCreateOrUpdate, onSelect, onDelete, isLoading, onEdit, onCancelEdit, profileToEdit, onOpenTeamManager }) => {
  
  const personalProfiles = profiles.filter(p => p.owner.type === 'user' && p.owner.id === user.id);
  const teamProfiles = profiles.filter(p => p.owner.type === 'team' && user.teamIds.includes(p.owner.id));

  const getTeamName = (teamId: number) => teams.find(t => t.id === teamId)?.name || 'Unknown Team';

  const hasProfiles = personalProfiles.length > 0 || teamProfiles.length > 0;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Welcome, {user.username.split('@')[0]}!</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {hasProfiles
            ? "Select a funding profile to begin your search or create a new one."
            : "Create your first funding profile to find tailored grant opportunities."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Profiles List */}
        <div className="lg:col-span-3 space-y-8">
            {/* Team Profiles */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center"><Users size={24} className="mr-3 text-primary" /> Shared Team Profiles</h2>
                    <button onClick={onOpenTeamManager} className="flex items-center text-sm font-medium text-primary hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors">
                        <Plus size={16} className="mr-1.5" />
                        Create Team
                    </button>
                </div>
                {teamProfiles.length > 0 ? (
                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <ul className="space-y-3">
                        {teamProfiles.map(profile => (
                            <li key={profile.id} className="p-4 border rounded-lg flex justify-between items-center group hover:border-primary/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-800">{profile.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <span className="font-semibold text-xs bg-gray-100 px-2 py-0.5 rounded-full">{getTeamName(profile.owner.id)}</span>
                                        <span>&middot;</span>
                                        <ProfileTypeIcon type={profile.profileType} />
                                        <span>{profile.industry}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onSelect(profile)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors">Select</button>
                                    <button onClick={() => onEdit(profile)} className="p-2 text-gray-400 hover:text-primary rounded-full opacity-0 group-hover:opacity-100 transition-all"><Pencil size={18} /></button>
                                    <button onClick={() => onDelete(profile.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                                </div>
                            </li>
                        ))}
                        </ul>
                     </div>
                ) : (
                    <div className="text-center text-sm text-gray-500 p-6 border-2 border-dashed rounded-lg">
                        You are not part of any teams with a funding profile yet.
                    </div>
                )}
            </div>

            {/* Personal Profiles */}
            <div>
                 <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center"><UserIcon size={24} className="mr-3 text-primary" /> Your Personal Profiles</h2>
                {personalProfiles.length > 0 ? (
                     <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                        <ul className="space-y-3">
                        {personalProfiles.map(profile => (
                             <li key={profile.id} className="p-4 border rounded-lg flex justify-between items-center group hover:border-primary/50 transition-colors">
                                <div>
                                    <p className="font-semibold text-gray-800">{profile.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <ProfileTypeIcon type={profile.profileType} />
                                        <span>{profile.industry}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => onSelect(profile)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 transition-colors">Select</button>
                                    <button onClick={() => onEdit(profile)} className="p-2 text-gray-400 hover:text-primary rounded-full opacity-0 group-hover:opacity-100 transition-all"><Pencil size={18} /></button>
                                    <button onClick={() => onDelete(profile.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                                </div>
                            </li>
                        ))}
                        </ul>
                     </div>
                ) : (
                     <div className="text-center text-sm text-gray-500 p-6 border-2 border-dashed rounded-lg">
                        You have no personal funding profiles. Create one now!
                    </div>
                )}
            </div>
        </div>
        
        {/* Profile Form */}
        <div id="profile-form-section" className="lg:col-span-2 sticky top-24">
           <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {profileToEdit ? `Editing "${profileToEdit.name}"` : 'Create New Profile'}
           </h2>
           <ProfileForm 
              onSubmit={(profileData, id) => {
                  const owner = profileData.profileType === 'Individual' ? { type: 'user' as const, id: user.id } : profileToEdit?.owner || { type: 'team' as const, id: user.teamIds[0] || -1 };
                  if(owner.type === 'team' && owner.id === -1) {
                      alert("You must be part of a team to create a Business or Non-Profit profile. Please create a team first.");
                      return;
                  }
                  const profileWithOwner = { ...profileData, owner };
                  onCreateOrUpdate(profileWithOwner, id);
              }}
              isLoading={isLoading} 
              initialData={profileToEdit}
              onCancel={onCancelEdit}
            />
        </div>
      </div>
    </div>
  );
};

export default ProfileSelection;
