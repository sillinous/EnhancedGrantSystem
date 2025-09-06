
import { Team, User } from '../types';

const TEAMS_KEY = 'grantfinder_teams';

const defaultTeams: Team[] = [
    { id: 101, name: 'EcoInnovate Foundation', memberIds: [1, 2, 4] },
    { id: 102, name: 'Pro User\'s Side Project', memberIds: [2] },
];

const getAllTeams = (): Team[] => {
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
    return allTeams.filter(team => team.memberIds.includes(userId));
};

export const createTeam = (name: string, creatorId: number): Team => {
    const allTeams = getAllTeams();
    const newTeam: Team = {
        id: Date.now(),
        name,
        memberIds: [creatorId], // Creator is the first member
    };
    const updatedTeams = [...allTeams, newTeam];
    saveAllTeams(updatedTeams);
    // In a real app, you would also update the user's teamIds here.
    // For the mock, we assume this happens automatically.
    return newTeam;
};
