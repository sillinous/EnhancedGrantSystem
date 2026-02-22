export { getAllGrantStatuses, saveGrantStatus } from './store';
export const calculatePipelineStats = (_grants: any[], _statuses: any) => ({
  total: _grants.length, applying: 0, submitted: 0, awarded: 0, totalValue: 0
});
