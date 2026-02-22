
export const getTeamsForUser = async () => [];
export const createTeam = async (data: any) => ({ id: 1, ...data });
export const getTeamById = async () => null;

export const hasPermission = (_user: any, _permission: string) => true;
export const getUserRoleInTeam = (_userId: number, _teamId: number) => 'Admin';
