import { BoilerplateDocument } from '../types';

const BOILERPLATE_KEY = 'grantfinder_boilerplates';

const getAllBoilerplates = (): Record<string, BoilerplateDocument[]> => {
  try {
    const data = localStorage.getItem(BOILERPLATE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to parse boilerplates from localStorage", error);
    return {};
  }
};

const saveAllBoilerplates = (allDocs: Record<string, BoilerplateDocument[]>): void => {
  try {
    localStorage.setItem(BOILERPLATE_KEY, JSON.stringify(allDocs));
  } catch (error) {
    console.error("Failed to save boilerplates to localStorage", error);
  }
};

export const getBoilerplates = (teamId: number): BoilerplateDocument[] => {
  const allDocs = getAllBoilerplates();
  return allDocs[String(teamId)] || [];
};

export const saveBoilerplate = (teamId: number, doc: BoilerplateDocument): void => {
  const allDocs = getAllBoilerplates();
  let teamDocs = allDocs[String(teamId)] || [];
  
  const existingIndex = teamDocs.findIndex(d => d.id === doc.id);
  if (existingIndex > -1) {
    teamDocs[existingIndex] = doc;
  } else {
    teamDocs.push(doc);
  }

  allDocs[String(teamId)] = teamDocs;
  saveAllBoilerplates(allDocs);
};

export const deleteBoilerplate = (teamId: number, docId: number): void => {
  const allDocs = getAllBoilerplates();
  let teamDocs = allDocs[String(teamId)] || [];
  allDocs[String(teamId)] = teamDocs.filter(d => d.id !== docId);
  saveAllBoilerplates(allDocs);
};
