import React, { useState, useEffect, useRef } from 'react';
import { GrantOpportunity, GrantDraft } from '../types';
import * as draftService from '../services/draftService';
import { BookText, Edit, Trash2, Save, X } from 'lucide-react';

interface DraftsManagerProps {
  grant: GrantOpportunity;
}

const DraftsManager: React.FC<DraftsManagerProps> = ({ grant }) => {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDrafts(draftService.getDrafts(grant));
  }, [grant]);
  
  useEffect(() => {
    if (editingDraftId && textareaRef.current) {
        // Auto-resize textarea
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingContent, editingDraftId]);

  const handleStartEditing = (draft: GrantDraft) => {
    setEditingDraftId(draft.id);
    setEditingContent(draft.content);
  };

  const handleCancelEditing = () => {
    setEditingDraftId(null);
    setEditingContent('');
  };

  const handleSaveDraft = () => {
    if (editingDraftId === null) return;
    const draftToUpdate = drafts.find(d => d.id === editingDraftId);
    if (draftToUpdate) {
      const updatedDraft = { ...draftToUpdate, content: editingContent };
      draftService.updateDraft(grant, updatedDraft);
      setDrafts(draftService.getDrafts(grant));
    }
    handleCancelEditing();
  };

  const handleDeleteDraft = (draftId: number) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
        draftService.deleteDraft(grant, draftId);
        setDrafts(draftService.getDrafts(grant));
    }
  };

  if (drafts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 animate-fade-in">
        <BookText size={32} className="mx-auto mb-2" />
        <p>No drafts saved for this grant yet.</p>
        <p className="text-sm mt-1">Use the AI Assistant's Drafting Tools to generate and save content here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(draft => (
        <div key={draft.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-gray-800">{draft.section}</h4>
            <div className="flex items-center gap-2">
              {editingDraftId === draft.id ? (
                <>
                  <button onClick={handleSaveDraft} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full" aria-label="Save draft"><Save size={16} /></button>
                  <button onClick={handleCancelEditing} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Cancel editing"><X size={16} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => handleStartEditing(draft)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Edit draft"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteDraft(draft.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full" aria-label="Delete draft"><Trash2 size={16} /></button>
                </>
              )}
            </div>
          </div>
           {editingDraftId === draft.id ? (
             <textarea
                ref={textareaRef}
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="w-full text-sm p-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none overflow-hidden"
                autoFocus
             />
           ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{draft.content}</p>
           )}
        </div>
      ))}
    </div>
  );
};

export default DraftsManager;