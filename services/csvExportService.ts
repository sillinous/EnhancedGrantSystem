import { GrantOpportunity, GrantStatus } from '../types';

const convertToCSV = (data: (GrantOpportunity & { status: GrantStatus })[]): string => {
    const headers = ['Name', 'Status', 'Funding Amount', 'Industry', 'Deadline', 'URL'];
    const rows = data.map(grant => [
        `"${grant.name.replace(/"/g, '""')}"`,
        grant.status,
        `"${grant.fundingAmount.replace(/"/g, '""')}"`,
        grant.industry,
        grant.deadline,
        grant.url
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const exportGrantsToCSV = (grants: (GrantOpportunity & { status: GrantStatus })[]): void => {
    if (grants.length === 0) {
        alert("No data to export.");
        return;
    }

    const csvString = convertToCSV(grants);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `grant_pipeline_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
