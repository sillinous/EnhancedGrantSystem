import { GrantOpportunity, GrantStatus, PipelineStats } from '../types';

const getGrantId = (grant: GrantOpportunity): string => {
  return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const parseFundingAmount = (amountStr: string): number => {
    if (!amountStr || typeof amountStr !== 'string') return 0;
    
    // Remove symbols and commas
    const cleanedStr = amountStr.replace(/[$,]/g, '');

    // Handle ranges (e.g., "50000 - 250000")
    if (cleanedStr.includes('-')) {
        const parts = cleanedStr.split('-').map(part => parseFloat(part.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return (parts[0] + parts[1]) / 2; // Return the average
        }
    }

    // Handle single numbers
    const singleNumber = parseFloat(cleanedStr);
    if (!isNaN(singleNumber)) {
        return singleNumber;
    }
    
    // Handle "Up to X"
    const upToMatch = cleanedStr.match(/up to ([\d.]+)/i);
    if (upToMatch && upToMatch[1]) {
        return parseFloat(upToMatch[1]);
    }

    return 0; // Return 0 if no number can be parsed
};

export const calculatePipelineStats = (
  trackedGrants: GrantOpportunity[],
  allStatuses: Record<string, GrantStatus>
): PipelineStats => {
  let totalPipeline = 0;
  let totalAwardedYTD = 0;
  let awardedCount = 0;
  let rejectedCount = 0;

  trackedGrants.forEach(grant => {
    const grantId = getGrantId(grant);
    const status = allStatuses[grantId] || 'Interested';
    const amount = parseFundingAmount(grant.fundingAmount);

    if (status === 'Interested' || status === 'Applying' || status === 'Submitted') {
      totalPipeline += amount;
    }

    if (status === 'Awarded') {
      // In a real app, you'd check if the award date is in the current year.
      // For this mock, we'll just sum all awarded grants.
      totalAwardedYTD += amount;
      awardedCount++;
    }

    if (status === 'Rejected') {
      rejectedCount++;
    }
  });

  const totalDecided = awardedCount + rejectedCount;
  const successRate = totalDecided > 0 ? (awardedCount / totalDecided) * 100 : 0;

  return {
    totalPipeline,
    totalAwardedYTD,
    successRate,
  };
};
