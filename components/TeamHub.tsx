import React, { useState, useEffect } from 'react';
import { User, Team, TeamMember, TeamRole, BoilerplateDocument } from '../types';
import Header from './Header';
import * as authService from '../services/authService';
import * as teamService from '../services/teamService';
import * as boilerplateService from '../services/boilerplateService';
import { Users, FileText, UserPlus, Save, Trash2, Edit, Plus, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './LoadingSpinner';

interface TeamHubProps {
  user: User;
  onLogout: () => void;
  teamId: number;
}

const TeamMemberManager: React.FC<{ team: Team, onUpdate: () => void, currentUser: User }> = ({ team, onUpdate, currentUser }) => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const { showToast } = useToast();
    
    useEffect(() => {
        const fetchUsers = async () => {
            const users = await authService.getAllUsers();
            setAllUsers(users);
        };
        fetchUsers();
    }, []);

    const getUsername = (userId: number) => allUsers.find(u => u.id === userId)?.username || 'Unknown User';
    
    const isCurrentUserLastAdmin = team.members.filter(m => m.role === 'Admin').length === 1 && team.members.find(m => m.userId === currentUser.id)?.role === 'Admin';


    const handleRoleChange = async (userId: number, newRole: TeamRole) => {
        if (userId === currentUser.id && newRole !== 'Admin' && isCurrentUserLastAdmin) {
            showToast("You cannot demote the last admin of the team.", "error");
            return;
        }
        await teamService.updateMemberRole(team.id, userId, newRole);
        onUpdate();
        showToast("Member role updated.", "success");
    };

    const handleRemoveMember = async (userId: number) => {
         if (userId === currentUser.id && isCurrentUserLastAdmin) {
            showToast("You cannot remove the last admin of the team.", "error");
            return;
        }
        if (window.confirm('Are you sure you want to remove this member?')) {
            await teamService.removeMemberFromTeam(team.id, userId);
            onUpdate();
            showToast("Member removed.", "success");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Manage Members</h3>
                <button className="flex items-center text-sm text-primary hover:underline" onClick={() => showToast("Inviting members is coming soon!", "info")}>
                    <UserPlus size={16} className="mr-1"/> Invite New Member
                </button>
            </div>
            {team.members.length > 0 ? (
                <ul className="space-y-2">
                    {team.members.map(member => (
                        <li key={member.userId} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                            <p className="font-medium">{getUsername(member.userId)}</p>
                            <div className="flex items-center gap-4">
                                <select value={member.role} onChange={(e) => handleRoleChange(member.userId, e.target.value as TeamRole)} className="text-sm p-1 border rounded-md">
                                    <option value="Admin">Admin</option>
                                    <option value="Editor">Editor</option>
                                    <option value="Viewer">Viewer</option>
                                    <option value="Approver">Approver</option>
                                </select>
                                {member.userId !== currentUser.id && <button onClick={() => handleRemoveMember(member.userId)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                    <Users size={32} className="mx-auto mb-2" />
                    <p>This team has no members.</p>
                </div>
            )}
        </div>
    );
};

const BoilerplateEditor: React.FC<{ team: Team, onUpdate: () => void }> = ({ team, onUpdate }) => {
    const [docs, setDocs] = useState<BoilerplateDocument[]>([]);
    const [editingDoc, setEditingDoc] = useState<BoilerplateDocument | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        const fetchDocs = async () => {
            const fetchedDocs = await boilerplateService.getBoilerplates(team.id);
            setDocs(fetchedDocs);
        };
        fetchDocs();
    }, [team.id]);

    const handleSave = async () => {
        if (editingDoc) {
            // FIX: The `saveBoilerplate` service function requires `teamId` as the first argument.
            await boilerplateService.saveBoilerplate(editingDoc.teamId, editingDoc);
            onUpdate();
            showToast("Boilerplate saved!", "success");
            setDocs(await boilerplateService.getBoilerplates(team.id));
            setEditingDoc(null);
        }
    };
    
    const handleAddNew = () => {
        setEditingDoc({id: Date.now(), teamId: team.id, title: 'New Boilerplate', content: ''});
    };

    const handleDelete = async (docId: number) => {
        if(window.confirm('Are you sure you want to delete this boilerplate document?')) {
            // FIX: The `deleteBoilerplate` service function requires `teamId` as the first argument.
            await boilerplateService.deleteBoilerplate(team.id, docId);
            onUpdate();
            showToast("Boilerplate deleted.", "success");
            setDocs(await boilerplateService.getBoilerplates(team.id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Boilerplate Library</h3>
                <button onClick={handleAddNew} className="flex items-center text-sm text-primary hover:underline">
                    <Plus size={16} className="mr-1"/> Add New Document
                </button>
            </div>
            {editingDoc && (
                <div className="p-4 border rounded-lg bg-gray-50 mb-4 space-y-2 animate-fade-in">
                    <input 
                        type="text" 
                        value={editingDoc.title}
                        onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})}
                        className="w-full p-2 font-bold text-lg border-b bg-transparent"
                    />
                    <textarea 
                        value={editingDoc.content}
                        onChange={(e) => setEditingDoc({...editingDoc, content: e.target.value})}
                        className="w-full p-2 border rounded-md min-h-[150px]"
                        placeholder="Enter your official content here..."
                    />
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="px-4 py-1.5 text-sm text-white bg-primary rounded-md">Save</button>
                        <button onClick={() => setEditingDoc(null)} className="px-4 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md">Cancel</button>
                    </div>
                </div>
            )}
            {docs.length > 0 ? (
                <ul className="space-y-2">
                    {docs.map(doc => (
                        <li key={doc.id} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                            <p className="font-medium">{doc.title}</p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingDoc(doc)}><Edit size={16}/></button>
                                <button onClick={() => handleDelete(doc.id)}><Trash2 size={16} className="text-red-500"/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg">
                    <FileText size={32} className="mx-auto mb-2" />
                    <p>Your boilerplate library is empty.</p>
                    <p className="text-xs mt-1">Add reusable content like your organization's history or mission statement.</p>
                </div>
            )}
        </div>
    );
};


const TeamHub: React.FC<TeamHubProps> = ({ user, onLogout, teamId }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [activeTab, setActiveTab] = useState<'members' | 'boilerplate'>('members');
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

    const fetchTeamData = async () => {
        try {
            // FIX: The function `getTeamById` does not exist in `teamService`. It has been added.
            const currentTeam = teamService.getTeamById(teamId);
            setTeam(currentTeam);
        } catch (error) {
            showToast("Failed to load team data.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchTeamData();
    }, [teamId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header user={user} onLogout={onLogout} />
                <main className="container mx-auto p-4 md:p-8">
                    <LoadingSpinner message="Loading team hub..." />
                </main>
            </div>
        );
    }
    
    if (!team) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header user={user} onLogout={onLogout} />
                <main className="container mx-auto p-4 md:p-8 text-center">
                    <AlertCircle size={40} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">Team Not Found</h2>
                    <p className="text-gray-600 mt-2">Could not find team data or you may not have permission to view it.</p>
                </main>
            </div>
        );
    }

    const TabButton: React.FC<{tab: 'members' | 'boilerplate', label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header user={user} onLogout={onLogout} />
            <main className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Organization Hub</h1>
                <p className="text-gray-600 mb-6">Managing "{team.name}"</p>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex border-b mb-6">
                        <TabButton tab="members" label="Members" icon={<Users size={16} />} />
                        <TabButton tab="boilerplate" label="Boilerplate Library" icon={<FileText size={16} />} />
                    </div>
                    {activeTab === 'members' && <TeamMemberManager team={team} onUpdate={fetchTeamData} currentUser={user} />}
                    {activeTab === 'boilerplate' && <BoilerplateEditor team={team} onUpdate={fetchTeamData} />}
                </div>
            </main>
        </div>
    );
};

export default TeamHub;
