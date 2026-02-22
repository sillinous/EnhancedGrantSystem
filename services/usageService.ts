export const getUsage = (_userId: any, _feature: string) => ({ remaining: 999, limit: 999 });
export const recordUsage = (_userId: any, _feature: string) => {};
export const checkUsage = (_userId: any, _feature: string) => ({ allowed: true, remaining: 999 });
