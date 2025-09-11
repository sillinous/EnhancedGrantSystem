import { Team, User, TeamRole, TeamMember } from '../types';

const TEAMS_KEY = 'grantfinder_teams';

const defaultTeams: Team[] = [
    { 
      id: 101, 
      name: 'EcoInnovate Foundation', 
      members: [
        { userId: 1, role: 'Editor' },
        { userId: 2, role: 'Admin' },
        { userId: 4, role: 'Viewer' },
      ] 
    },
    { 
      id: 102, 
      name: 'Pro User\'s Side Project', 
      members: [{ userId: 2, role: 'Admin' }] 
    },
];

export const getAllTeams = (): Team[] => {
    try {
        const teamsJson = localStorage.getItem(TEAMS_KEY);
        if (teamsJson) {
            return JSON.parse(teamsJson);
        } else {
            localStorage.setItem(TEAMS_KEY, JSON.stringify(defaultTeams));
            return defaultTeams;
        }
    } catch (error) {
        console.error("Failed to parse teams from localStorage", error);
        return [];
    }
};

const saveAllTeams = (teams: Team[]): void => {
    try {
        localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
    } catch (error) {
        console.error("Failed to save teams to localStorage", error);
    }
};

export const getTeamsForUser = (userId: number): Team[] => {
    const allTeams = getAllTeams();
    return allTeams.filter(team => team.members.some(m => m.userId === userId));
};

export const getTeamById = (teamId: number): Team | null => {
    const allTeams = getAllTeams();
    return allTeams.find(t => t.id === teamId) || null;
};

export const getUserRoleInTeam = (userId: number, teamId: number): TeamRole | null => {
    const allTeams = getAllTeams();
    const team = allTeams.find(t => t.id === teamId);
    if (!team) return null;
    const member = team.members.find(m => m.userId === userId);
    return member ? member.role : null;
};

export const createTeam = (name: string, creatorId: number): Team => {
    const allTeams = getAllTeams();
    const newTeam: Team = {
        id: Date.now(),
        name,
        members: [{ userId: creatorId, role: 'Admin' }], // Creator is the first admin
    };
    const updatedTeams = [...allTeams, newTeam];
    saveAllTeams(updatedTeams);
    // In a real app, you would also update the user's teamIds here.
    // For the mock, we assume this happens automatically.
    return newTeam;
};

export const updateMemberRole = (teamId: number, userId: number, newRole: TeamRole) => {
    const allTeams = getAllTeams();
    const teamIndex = allTeams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    const memberIndex = allTeams[teamIndex].members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) return;

    allTeams[teamIndex].members[memberIndex].role = newRole;
    saveAllTeams(allTeams);
};

export const removeMemberFromTeam = (teamId: number, userId: number) => {
    const allTeams = getAllTeams();
    const teamIndex = allTeams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    allTeams[teamIndex].members = allTeams[teamIndex].members.filter(m => m.userId !== userId);
    saveAllTeams(allTeams);
};

export const addMemberToTeam = (teamId: number, userId: number) => {
    // This is a mock. In reality you'd find a user and add them.
    // Here we just add a new member with a default role.
    const allTeams = getAllTeams();
    const teamIndex = allTeams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) return;

    if (!allTeams[teamIndex].members.some(m => m.userId === userId)) {
        allTeams[teamIndex].members.push({ userId: userId, role: 'Viewer' });
        saveAllTeams(allTeams);
    }
};

// FIX: Add missing `hasPermission` function.
export const hasPermission = (userId: number, teamId: number, permission: 'canManageTeam'): boolean => {
    const role = getUserRoleInTeam(userId, teamId);
    if (!role) return false;

    if (permission === 'canManageTeam') {
        // For simplicity, only Admins can manage the team in this mock setup.
        return role === 'Admin';
    }
    // Can be extended for other permissions
    return false;
};
