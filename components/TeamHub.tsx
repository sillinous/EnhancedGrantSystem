import React, { useState, useEffect } from 'react';
import { User, Team, TeamMember, TeamRole, BoilerplateDocument } from '../types';
import Header from './Header';
import * as authService from '../services/authService';
import * as teamService from '../services/teamService';
import * as boilerplateService from '../services/boilerplateService';
import { Users, FileText, UserPlus, Save, Trash2, Edit, Plus } from 'lucide-react';

interface TeamHubProps {
  user: User;
  onLogout: () => void;
  teamId: number;
}

const TeamMemberManager: React.FC<{ team: Team, onUpdate: () => void }> = ({ team, onUpdate }) => {
    const allUsers = authService.getAllUsers();
    
    const getUsername = (userId: number) => allUsers.find(u => u.id === userId)?.username || 'Unknown User';

    const handleRoleChange = (userId: number, newRole: TeamRole) => {
        teamService.updateMemberRole(team.id, userId, newRole);
        onUpdate();
    };

    const handleRemoveMember = (userId: number) => {
        if (window.confirm('Are you sure you want to remove this member?')) {
            teamService.removeMemberFromTeam(team.id, userId);
            onUpdate();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Manage Members</h3>
                <button className="flex items-center text-sm text-primary hover:underline">
                    <UserPlus size={16} className="mr-1"/> Invite New Member
                </button>
            </div>
            <ul className="space-y-2">
                {team.members.map(member => (
                    <li key={member.userId} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center">
                        <p className="font-medium">{getUsername(member.userId)}</p>
                        <div className="flex items-center gap-4">
                            <select value={member.role} onChange={(e) => handleRoleChange(member.userId, e.target.value as TeamRole)} className="text-sm p-1 border rounded-md">
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                            <button onClick={() => handleRemoveMember(member.userId)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const BoilerplateEditor: React.FC<{ team: Team }> = ({ team }) => {
    const [docs, setDocs] = useState<BoilerplateDocument[]>([]);
    const [editingDoc, setEditingDoc] = useState<BoilerplateDocument | null>(null);

    useEffect(() => {
        setDocs(boilerplateService.getBoilerplates(team.id));
    }, [team.id]);

    const handleSave = () => {
        if (editingDoc) {
            boilerplateService.saveBoilerplate(team.id, editingDoc);
            setDocs(boilerplateService.getBoilerplates(team.id));
            setEditingDoc(null);
        }
    };
    
    const handleAddNew = () => {
        setEditingDoc({id: Date.now(), teamId: team.id, title: 'New Boilerplate', content: ''});
    };

    const handleDelete = (docId: number) => {
        if(window.confirm('Are you sure you want to delete this boilerplate document?')) {
            boilerplateService.deleteBoilerplate(team.id, docId);
            setDocs(boilerplateService.getBoilerplates(team.id));
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
                <div className="p-4 border rounded-lg bg-gray-50 mb-4 space-y-2">
                    <input 
                        type="text" 
                        value={editingDoc.title}
                        onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})}
                        className="w-full p-2 font-bold text-lg border-b"
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
        </div>
    );
};


const TeamHub: React.FC<TeamHubProps> = ({ user, onLogout, teamId }) => {
    const [team, setTeam] = useState<Team | null>(null);
    const [activeTab, setActiveTab] = useState<'members' | 'boilerplate'>('members');

    useEffect(() => {
        const allTeams = teamService.getAllTeams();
        const currentTeam = allTeams.find(t => t.id === teamId);
        setTeam(currentTeam || null);
    }, [teamId]);

    if (!team) {
        return <div>Loading team...</div>;
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
            <Header user={user} onLogout={onLogout} isPublic={false} />
            <main className="container mx-auto p-4 md:p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Organization Hub</h1>
                <p className="text-gray-600 mb-6">Managing "{team.name}"</p>

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex border-b mb-6">
                        <TabButton tab="members" label="Members" icon={<Users size={16} />} />
                        <TabButton tab="boilerplate" label="Boilerplate Library" icon={<FileText size={16} />} />
                    </div>
                    {activeTab === 'members' && <TeamMemberManager team={team} onUpdate={() => setTeam({...team})} />}
                    {activeTab === 'boilerplate' && <BoilerplateEditor team={team} />}
                </div>
            </main>
        </div>
    );
};

export default TeamHub;
