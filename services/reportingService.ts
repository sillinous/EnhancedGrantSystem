export { getReportingRequirements as getRequirements, addReportingRequirement as addRequirement, updateReportingRequirement as updateRequirement } from './store';
export const deleteRequirement = (grantId: string, id: number) => {
  const key = 'gos_reporting_' + grantId;
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(items.filter((r: any) => r.id !== id)));
  } catch {}
};
export { getReportingRequirements, addReportingRequirement, updateReportingRequirement } from './store';
