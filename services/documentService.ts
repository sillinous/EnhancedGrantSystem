import { Document } from '../types';

const DOCUMENTS_KEY = 'grantfinder_documents';

const getAllDocuments = (): Record<string, Document[]> => {
  try {
    const documentsJson = localStorage.getItem(DOCUMENTS_KEY);
    return documentsJson ? JSON.parse(documentsJson) : {};
  } catch (error) {
    console.error("Failed to parse documents from localStorage", error);
    return {};
  }
};

const saveAllDocuments = (allDocs: Record<string, Document[]>): void => {
  try {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(allDocs));
  } catch (error) {
    console.error("Failed to save documents to localStorage", error);
  }
};

export const getDocuments = (profileId: number): Document[] => {
  const allDocs = getAllDocuments();
  return allDocs[String(profileId)] || [];
};

export const addDocument = (profileId: number, docData: { name: string; category: string }): Document => {
  const allDocs = getAllDocuments();
  const profileDocs = allDocs[String(profileId)] || [];
  const newDoc: Document = {
    ...docData,
    id: Date.now(),
    profileId,
  };
  allDocs[String(profileId)] = [...profileDocs, newDoc];
  saveAllDocuments(allDocs);
  return newDoc;
};

export const updateDocument = (profileId: number, updatedDoc: Document): void => {
  const allDocs = getAllDocuments();
  let profileDocs = allDocs[String(profileId)] || [];
  profileDocs = profileDocs.map(d => d.id === updatedDoc.id ? updatedDoc : d);
  allDocs[String(profileId)] = profileDocs;
  saveAllDocuments(allDocs);
};

export const deleteDocument = (profileId: number, documentId: number): void => {
  const allDocs = getAllDocuments();
  let profileDocs = allDocs[String(profileId)] || [];
  allDocs[String(profileId)] = profileDocs.filter(d => d.id !== documentId);
  saveAllDocuments(allDocs);
};