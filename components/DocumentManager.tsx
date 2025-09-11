
import React, { useState, useEffect } from 'react';
import { FundingProfile, Document } from '../types';
import * as docService from '../services/documentService';
import { UploadCloud, FileText, Trash2, Edit3, Save } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface DocumentManagerProps {
  profile: FundingProfile;
}

const documentCategories = ['Business Plan', 'Financial Statement', 'Pitch Deck', 'Legal Document', 'Other'];

const DocumentManager: React.FC<DocumentManagerProps> = ({ profile }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState(documentCategories[0]);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingDocName, setEditingDocName] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const docs = await docService.getDocuments(profile.id);
            setDocuments(docs);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchDocuments();
  }, [profile.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setNewDocName(file.name);
  };

  const handleAddDocument = async () => {
    if (!newDocName.trim()) return;
    await docService.addDocument(profile.id, { name: newDocName.trim(), category: newDocCategory });
    setDocuments(await docService.getDocuments(profile.id));
    setNewDocName('');
    setNewDocCategory(documentCategories[0]);
    const fileInput = document.getElementById('doc-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleDeleteDocument = async (docId: number) => {
    await docService.deleteDocument(profile.id, docId);
    setDocuments(await docService.getDocuments(profile.id));
  };

  const handleStartEdit = (doc: Document) => {
    setEditingDocId(doc.id);
    setEditingDocName(doc.name);
  };

  const handleSaveEdit = async (docId: number) => {
    const docToUpdate = documents.find(d => d.id === docId);
    if (docToUpdate && editingDocName.trim()) {
      const updatedDoc = { ...docToUpdate, name: editingDocName.trim() };
      await docService.updateDocument(profile.id, updatedDoc);
      setDocuments(await docService.getDocuments(profile.id));
    }
    setEditingDocId(null);
    setEditingDocName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Add New Document</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <div className="flex items-center gap-3"><input id="doc-upload-input" type="file" onChange={handleFileChange} className="hidden" /><label htmlFor="doc-upload-input" className="cursor-pointer flex-shrink-0 px-4 py-2 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-2"><UploadCloud size={16} /> Choose File</label><input type="text" value={newDocName} onChange={(e) => setNewDocName(e.target.value)} placeholder="Or enter document name" className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm"/></div>
          <select value={newDocCategory} onChange={(e) => setNewDocCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm">{documentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
          <button onClick={handleAddDocument} disabled={!newDocName.trim()} className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors">Add to Library</button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Document Library</h3>
        {isLoading ? <LoadingSpinner /> : documents.length > 0 ? (
          <ul className="space-y-2">
            {documents.map(doc => (
              <li key={doc.id} className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between group">
                <div className="flex items-center gap-3 overflow-hidden"><FileText className="text-primary flex-shrink-0" size={20} /><div className="flex-grow overflow-hidden">{editingDocId === doc.id ? <input type="text" value={editingDocName} onChange={(e) => setEditingDocName(e.target.value)} className="text-sm px-2 py-1 border border-primary rounded-md w-full" onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(doc.id)} onBlur={() => handleSaveEdit(doc.id)} autoFocus/> : <p className="font-medium text-gray-800 text-sm truncate" title={doc.name}>{doc.name}</p>}<p className="text-xs text-gray-500">{doc.category}</p></div></div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">{editingDocId === doc.id ? <button onClick={() => handleSaveEdit(doc.id)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" aria-label="Save name"><Save size={16} /></button> : <button onClick={() => handleStartEdit(doc)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Edit name"><Edit3 size={16} /></button>}<button onClick={() => handleDeleteDocument(doc.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full" aria-label="Delete document"><Trash2 size={16} /></button></div>
              </li>
            ))}
          </ul>
        ) : (<p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg border border-dashed">Your document library is empty.</p>)}
      </div>
    </div>
  );
};

export default DocumentManager;
