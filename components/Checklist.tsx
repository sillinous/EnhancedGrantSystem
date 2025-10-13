
import React, { useState, useEffect } from 'react';
import { ChecklistItem, FundingProfile, Document } from '../types';
import * as checklistService from '../services/checklistService';
import * as documentService from '../services/documentService';
import { Plus, Trash2, Paperclip, FileText, X, Calendar } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ChecklistProps {
  grantId: string;
  profile: FundingProfile;
}

const Checklist: React.FC<ChecklistProps> = ({ grantId, profile }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState('');
  const [attachingToItemId, setAttachingToItemId] = useState<number | null>(null);
  const [availableDocs, setAvailableDocs] = useState<Document[]>([]);

  useEffect(() => {
    const fetchChecklist = async () => {
        setIsLoading(true);
        try {
            const checklistItems = await checklistService.getChecklist(grantId);
            setItems(checklistItems);
        } catch (error) {
            console.error("Failed to fetch checklist", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchChecklist();
  }, [grantId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    try {
        const newItem = await checklistService.addChecklistItem(grantId, {
            text: newItemText.trim(),
            dueDate: newItemDueDate || undefined,
        });
        setItems(prev => [...prev, newItem]);
        setNewItemText('');
        setNewItemDueDate('');
    } catch (error) {
        console.error("Failed to add item", error);
    }
  };

  const handleToggleItem = async (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
        const updatedItem = await checklistService.updateChecklistItem(grantId, { ...item, completed: !item.completed });
        setItems(items.map(i => (i.id === id ? updatedItem : i)));
    } catch (error) {
        console.error("Failed to toggle item", error);
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
        await checklistService.deleteChecklistItem(grantId, id);
        setItems(items.filter(item => item.id !== id));
    } catch (error) {
        console.error("Failed to delete item", error);
    }
  };

  const handleOpenAttachMenu = async (itemId: number) => {
    try {
        const docs = await documentService.getDocuments(profile.id);
        setAvailableDocs(docs);
        setAttachingToItemId(itemId);
    } catch (error) {
        console.error("Failed to fetch documents", error);
    }
  };

  const handleAttachDoc = async (itemId: number, doc: Document) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    try {
        const updatedItem = await checklistService.updateChecklistItem(grantId, { ...item, documentId: doc.id, documentName: doc.name });
        setItems(items.map(i => i.id === itemId ? updatedItem : i));
        setAttachingToItemId(null);
    } catch (error) {
        console.error("Failed to attach document", error);
    }
  };

  const handleDetachDoc = async (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const { documentId, documentName, ...rest } = item;
    try {
        const updatedItem = await checklistService.updateChecklistItem(grantId, rest);
        setItems(items.map(i => i.id === itemId ? updatedItem : i));
    } catch (error) {
        console.error("Failed to detach document", error);
    }
  };

  if (isLoading) {
      return <LoadingSpinner message="Loading checklist..." />;
  }

  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Application Checklist</h3>
      <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4 items-center">
        <input type="text" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} placeholder="Add a new task..." className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm" aria-label="New checklist item" />
        <div className="flex gap-2">
            <input type="date" value={newItemDueDate} onChange={(e) => setNewItemDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary focus:border-primary text-sm text-gray-500" aria-label="Due date for new item"/>
            <button type="submit" className="flex-shrink-0 p-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400" disabled={!newItemText.trim()} aria-label="Add checklist item"><Plus size={20} /></button>
        </div>
      </form>
      <ul className="space-y-2">
        {items.length > 0 ? (
          items.map(item => (
            <li key={item.id} className="flex items-center justify-between p-2 rounded-md group transition-colors hover:bg-gray-50">
              <div className="flex items-center flex-grow mr-2">
                 <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={item.completed} onChange={() => handleToggleItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mr-3 cursor-pointer"/>
                    <span className={`text-sm text-gray-700 ${item.completed ? 'line-through text-gray-500' : ''}`}>{item.text}</span>
                 </label>
                 {item.dueDate && (<div className="ml-3 flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /><span>{new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</span></div>)}
              </div>
              <div className="flex items-center gap-1 relative flex-shrink-0">
                {item.documentName ? (
                    <div className="flex items-center gap-1 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                        <FileText size={12} className="flex-shrink-0" />
                        <span className="max-w-[120px] truncate" title={item.documentName}>{item.documentName}</span>
                        <button onClick={() => handleDetachDoc(item.id)} className="ml-1 text-gray-500 hover:text-black rounded-full"><X size={14} /></button>
                    </div>
                ) : (
                  <button onClick={() => handleOpenAttachMenu(item.id)} className="p-1 text-gray-400 hover:text-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Attach document"><Paperclip size={16} /></button>
                )}
                {attachingToItemId === item.id && (
                    <div className="absolute right-0 top-8 z-20 bg-white shadow-lg rounded-md border w-56">
                       <div className="p-2">
                          <h4 className="text-xs font-bold text-gray-600 px-1 pb-1 mb-1 border-b">Attach a document</h4>
                          {availableDocs.length > 0 ? (<ul className="mt-1 max-h-32 overflow-y-auto">{availableDocs.map(doc => (<li key={doc.id} onClick={() => handleAttachDoc(item.id, doc)} className="text-sm p-1.5 hover:bg-gray-100 rounded cursor-pointer truncate">{doc.name}</li>))}</ul>) : (<p className="text-xs text-gray-500 p-2 text-center">No documents in library.</p>)}
                       </div>
                       <button onClick={() => setAttachingToItemId(null)} className="w-full text-center text-xs text-gray-500 hover:text-black py-1 border-t bg-gray-50 rounded-b-md">Cancel</button>
                    </div>
                )}
                <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Delete item: ${item.text}`}><Trash2 size={16} /></button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No checklist items yet. Add one to get started!</p>
        )}
      </ul>
    </div>
  );
};

export default Checklist;
