import React, { useState, useEffect, useRef } from 'react';
import { GrantOpportunity, GrantDraft, FundingProfile, User, TeamRole } from '../types';
import * as draftService from '../services/draftService';
import * as teamService from '../services/teamService';
import { BookText, Edit, Trash2, Save, X, Send, CheckCircle, RefreshCw, Undo2 } from 'lucide-react';

interface DraftsManagerProps {
  grant: GrantOpportunity;
  profile: FundingProfile;
  user: User;
}

const DraftStatusBadge: React.FC<{ status: GrantDraft['status'] }> = ({ status }) => {
    const styles: Record<GrantDraft['status'], string> = {
        'Draft': 'bg-gray-100 text-gray-700',
        'Pending Approval': 'bg-yellow-100 text-yellow-800',
        'Approved': 'bg-green-100 text-green-800',
    };
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>
            {status}
        </span>
    );
};

const DraftsManager: React.FC<DraftsManagerProps> = ({ grant, profile, user }) => {
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [userRole, setUserRole] = useState<TeamRole | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDrafts(draftService.getDrafts(grant));
    if (profile.owner.type === 'team') {
        setUserRole(teamService.getUserRoleInTeam(user.id, profile.owner.id));
    }
  }, [grant, profile, user]);
  
  useEffect(() => {
    if (editingDraftId && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingContent, editingDraftId]);

  const handleStatusChange = (draft: GrantDraft, newStatus: GrantDraft['status']) => {
      const updatedDraft = { ...draft, status: newStatus };
      draftService.updateDraft(grant, updatedDraft);
      setDrafts(draftService.getDrafts(grant));
  };

  const handleStartEditing = (draft: GrantDraft) => {
    const canEdit =
      userRole === 'Admin' ||
      userRole === 'Approver' ||
      (userRole === 'Editor' && draft.status === 'Draft');

    if (!canEdit) {
      if (userRole === 'Editor' && draft.status !== 'Draft') {
        alert(`This draft is currently "${draft.status}" and cannot be edited until an approver requests changes.`);
      } else {
        alert("You do not have permission to edit this draft in its current state.");
      }
      return;
    }
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
      // When an editor saves, it goes back to 'Draft' status
      const newStatus = (userRole === 'Admin' || userRole === 'Approver') ? draftToUpdate.status : 'Draft';
      const updatedDraft = { ...draftToUpdate, content: editingContent, status: newStatus };
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
            <div className="flex items-center gap-3">
                <h4 className="font-semibold text-gray-800">{draft.section}</h4>
                <DraftStatusBadge status={draft.status} />
            </div>
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
           {userRole && editingDraftId !== draft.id && (
               <div className="mt-3 pt-3 border-t flex items-center gap-2">
                   {(userRole === 'Editor') && draft.status === 'Draft' && (
                       <button onClick={() => handleStatusChange(draft, 'Pending Approval')} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md border border-primary/30">
                           <Send size={14} /> Submit for Approval
                       </button>
                   )}
                   {(userRole === 'Admin' || userRole === 'Approver') && draft.status === 'Pending Approval' && (
                       <>
                        <button onClick={() => handleStatusChange(draft, 'Approved')} className="flex items-center gap-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors px-3 py-1.5 rounded-md border border-green-200">
                           <CheckCircle size={14} /> Approve
                       </button>
                       <button onClick={() => handleStatusChange(draft, 'Draft')} className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors px-3 py-1.5 rounded-md border border-orange-200">
                           <RefreshCw size={14} /> Request Changes
                       </button>
                       </>
                   )}
                   {(userRole === 'Admin' || userRole === 'Approver') && draft.status === 'Approved' && (
                       <button onClick={() => handleStatusChange(draft, 'Draft')} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors px-3 py-1.5 rounded-md border border-gray-200">
                           <Undo2 size={14} /> Revert to Draft
                       </button>
                   )}
               </div>
           )}
        </div>
      ))}
    </div>
  );
};

export default DraftsManager;