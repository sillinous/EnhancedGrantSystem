
import React, { useState, useEffect, useRef } from 'react';
import { GrantOpportunity, GrantDraft, FundingProfile, User, TeamRole } from '../types';
import * as draftService from '../services/draftService';
import * as teamService from '../services/teamService';
import { BookText, Edit, Trash2, Save, X, Send, CheckCircle, RefreshCw, Undo2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface DraftsManagerProps {
  grantId: string;
  profile: FundingProfile;
  user: User;
  onDraftUpdate: (grantId: string) => void;
}

const DraftStatusBadge: React.FC<{ status: GrantDraft['status'] }> = ({ status }) => {
    const styles: Record<GrantDraft['status'], string> = {
        'Draft': 'bg-gray-100 text-gray-700',
        'Pending Approval': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-green-100 text-green-800',
    };
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>{status}</span>;
};

const DraftsManager: React.FC<DraftsManagerProps> = ({ grantId, profile, user, onDraftUpdate }) => {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [userRole, setUserRole] = useState<TeamRole | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const fetchedDrafts = await draftService.getDrafts(grantId);
            setDrafts(fetchedDrafts);
            if (profile.owner.type === 'team') {
                setUserRole(teamService.getUserRoleInTeam(user.id, profile.owner.id));
            }
        } catch (error) {
            console.error("Failed to fetch drafts", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [grantId, profile, user, onDraftUpdate]);
  
  useEffect(() => {
    if (editingDraftId && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingContent, editingDraftId]);

  const handleStatusChange = async (draft: GrantDraft, newStatus: GrantDraft['status']) => {
      const updatedDraft = { ...draft, status: newStatus };
      await draftService.updateDraft(grantId, updatedDraft);
      setDrafts(await draftService.getDrafts(grantId));
  };

  const handleStartEditing = (draft: GrantDraft) => {
    setEditingDraftId(draft.id);
    setEditingContent(draft.content);
  };

  const handleCancelEditing = () => {
    setEditingDraftId(null);
    setEditingContent('');
  };

  const handleSaveDraft = async () => {
    if (editingDraftId === null) return;
    const draftToUpdate = drafts.find(d => d.id === editingDraftId);
    if (draftToUpdate) {
      const updatedDraft = { ...draftToUpdate, content: editingContent };
      await draftService.updateDraft(grantId, updatedDraft);
      setDrafts(await draftService.getDrafts(grantId));
    }
    handleCancelEditing();
  };

  const handleDeleteDraft = async (draftId: number) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
        await draftService.deleteDraft(grantId, draftId);
        setDrafts(await draftService.getDrafts(grantId));
        onDraftUpdate(grantId);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading drafts..." />;

  if (drafts.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 animate-fade-in">
        <BookText size={32} className="mx-auto mb-2" />
        <p>No drafts saved for this grant yet.</p>
        <p className="text-sm mt-1">Use the AI Assistant to generate and save content here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {drafts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(draft => (
        <div key={draft.id} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-800">{draft.section}</h4>
                <DraftStatusBadge status={draft.status} />
            </div>
            <div className="flex items-center gap-2">
              {editingDraftId === draft.id ? (
                <>
                  <button onClick={handleSaveDraft} className="p-1.5 text-green-600 hover:bg-green-100 rounded-full"><Save size={16} /></button>
                  <button onClick={handleCancelEditing} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><X size={16} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => handleStartEditing(draft)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Edit size={16} /></button>
                  <button onClick={() => handleDeleteDraft(draft.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                </>
              )}
            </div>
          </div>
           {editingDraftId === draft.id ? (
             <textarea ref={textareaRef} value={editingContent} onChange={(e) => setEditingContent(e.target.value)} className="w-full text-sm p-2 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none overflow-hidden" autoFocus />
           ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{draft.content}</p>
           )}
           {userRole && editingDraftId !== draft.id && (
               <div className="mt-3 pt-3 border-t flex items-center gap-2">
                   {(userRole === 'Editor') && draft.status === 'Draft' && <button onClick={() => handleStatusChange(draft, 'Pending Approval')} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md border border-primary/30"><Send size={14} /> Submit for Approval</button>}
                   {(userRole === 'Admin' || userRole === 'Approver') && draft.status === 'Pending Approval' && (<><button onClick={() => handleStatusChange(draft, 'Approved')} className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors px-3 py-1.5 rounded-md border border-green-200"><CheckCircle size={14} /> Approve</button><button onClick={() => handleStatusChange(draft, 'Draft')} className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors px-3 py-1.5 rounded-md border border-orange-200"><RefreshCw size={14} /> Request Changes</button></>)}
                   {(userRole === 'Admin' || userRole === 'Approver') && draft.status === 'Approved' && <button onClick={() => handleStatusChange(draft, 'Draft')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-md border border-gray-200"><Undo2 size={14} /> Revert to Draft</button>}
               </div>
           )}
        </div>
      ))}
    </div>
  );
};

export default DraftsManager;
