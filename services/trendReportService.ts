import { FundingTrendReport } from '../types';

const TRENDS_KEY = 'grantfinder_trendReports';

const getAllReports = (): Record<string, FundingTrendReport> => {
  try {
    const data = localStorage.getItem(TRENDS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) { return {}; }
};

const saveAllReports = (reports: Record<string, FundingTrendReport>): void => {
    localStorage.setItem(TRENDS_KEY, JSON.stringify(reports));
};

export const getTrendReport = (sector: string): FundingTrendReport | null => {
    return getAllReports()[sector.toLowerCase().trim()] || null;
};

export const saveTrendReport = (sector: string, report: FundingTrendReport): void => {
    const allReports = getAllReports();
    allReports[sector.toLowerCase().trim()] = report;
    saveAllReports(allReports);
};
