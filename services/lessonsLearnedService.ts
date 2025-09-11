import { LessonsLearnedReport } from '../types';

const LESSONS_KEY = 'grantfinder_lessonsLearned';

const getAllReports = (): Record<string, LessonsLearnedReport> => {
  try {
    const data = localStorage.getItem(LESSONS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) { return {}; }
};

const saveAllReports = (reports: Record<string, LessonsLearnedReport>): void => {
    localStorage.setItem(LESSONS_KEY, JSON.stringify(reports));
};

export const getLessonsLearnedReport = (teamId: number): LessonsLearnedReport | null => {
    return getAllReports()[String(teamId)] || null;
};

export const saveLessonsLearnedReport = (teamId: number, report: LessonsLearnedReport): void => {
    const allReports = getAllReports();
    allReports[String(teamId)] = report;
    saveAllReports(allReports);
};
