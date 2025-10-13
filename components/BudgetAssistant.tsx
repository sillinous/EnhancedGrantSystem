
import React, { useState, useEffect, useRef } from 'react';
import { GrantOpportunity, FundingProfile, BudgetItem, GrantDraft } from '../types';
import * as budgetService from '../services/budgetService';
import * as draftService from '../services/draftService';
import { generateBudgetJustification } from '../services/geminiService';
import { Plus, Trash2, Wand2, Edit, Save, X, DollarSign } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface BudgetAssistantProps {
  grantId: string;
  profile: FundingProfile;
}

const BudgetAssistant: React.FC<BudgetAssistantProps> = ({ grantId, profile }) => {
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [drafts, setDrafts] = useState<GrantDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingJustification, setEditingJustification] = useState('');
  const [generatingForId, setGeneratingForId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [budgetItems, grantDrafts] = await Promise.all([
                budgetService.getBudgetItems(grantId),
                draftService.getDrafts(grantId)
            ]);
            setItems(budgetItems);
            setDrafts(grantDrafts);
        } catch (error) {
            console.error("Failed to load budget data", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [grantId]);
  
  useEffect(() => {
    if (editingItemId && textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [editingJustification, editingItemId]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim() || !newItemAmount) return;
    const amount = parseFloat(newItemAmount);
    if (isNaN(amount)) return;

    await budgetService.addBudgetItem(grantId, { description: newItemDesc.trim(), amount });
    setItems(await budgetService.getBudgetItems(grantId));
    setNewItemDesc('');
    setNewItemAmount('');
  };

  const handleDeleteItem = async (id: number) => {
    await budgetService.deleteBudgetItem(grantId, id);
    setItems(await budgetService.getBudgetItems(grantId));
  };

  const handleGenerateJustification = async (item: BudgetItem) => {
    setGeneratingForId(item.id);
    try {
      const justification = await generateBudgetJustification(grant, drafts, item);
      const updatedItem = { ...item, justification };
      await budgetService.updateBudgetItem(grantId, updatedItem);
      setItems(await budgetService.getBudgetItems(grantId));
    } catch (e) {
      console.error("Failed to generate justification", e);
    } finally {
      setGeneratingForId(null);
    }
  };

  const handleStartEditing = (item: BudgetItem) => {
    setEditingItemId(item.id);
    setEditingJustification(item.justification);
  };

  const handleSaveEdit = async () => {
    if (editingItemId === null) return;
    const itemToUpdate = items.find(i => i.id === editingItemId);
    if (itemToUpdate) {
      const updatedItem = { ...itemToUpdate, justification: editingJustification };
      await budgetService.updateBudgetItem(grantId, updatedItem);
      setItems(await budgetService.getBudgetItems(grantId));
    }
    setEditingItemId(null);
    setEditingJustification('');
  };

  const totalBudget = items.reduce((sum, item) => sum + item.amount, 0);
  
  // A grant object is needed for the geminiService but the props only pass grantId.
  // This is a temporary solution for the mock.
  const grant: GrantOpportunity = { name: "Grant", url: grantId, description: "", fundingAmount: "", industry: "", deadline: "" };


  if (isLoading) return <LoadingSpinner message="Loading budget..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Budget Item</h3>
        <form onSubmit={handleAddItem} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <input type="text" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} placeholder="Line item description" className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm" required/>
          <div className="relative"><DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="number" value={newItemAmount} onChange={(e) => setNewItemAmount(e.target.value)} placeholder="Amount" className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm" required min="0" step="any"/></div>
          <button type="submit" className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400"><Plus size={16} className="mr-2" /> Add Item</button>
        </form>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-800">Budget Items</h3><div className="text-right"><p className="text-sm text-gray-600">Total Budget</p><p className="font-bold text-lg text-primary">${totalBudget.toLocaleString()}</p></div></div>
        {items.length === 0 ? <p className="text-sm text-center text-gray-500 py-4">No budget items added yet.</p> : items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start">
                <div><p className="font-semibold text-gray-800">{item.description}</p><p className="text-primary font-bold">${item.amount.toLocaleString()}</p></div>
                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full" aria-label="Delete item"><Trash2 size={16} /></button>
              </div>
              <div className="mt-3 border-t pt-3">
                {generatingForId === item.id ? <LoadingSpinner message="AI is drafting the justification..." size="small" /> : item.justification ? (
                  <div>
                    {editingItemId === item.id ? (<div><textarea ref={textareaRef} value={editingJustification} onChange={(e) => setEditingJustification(e.target.value)} className="w-full text-sm p-2 border border-primary rounded-md resize-none overflow-hidden"/>
                    <div className="flex gap-2 mt-2"><button onClick={handleSaveEdit} className="flex items-center text-xs font-semibold text-white bg-primary px-2 py-1 rounded-md"><Save size={14} className="mr-1" /> Save</button><button onClick={() => setEditingItemId(null)} className="flex items-center text-xs font-semibold text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md"><X size={14} className="mr-1" /> Cancel</button></div></div>) 
                    : (<div><p className="text-sm text-gray-700 whitespace-pre-wrap">{item.justification}</p><button onClick={() => handleStartEditing(item)} className="flex items-center mt-2 text-xs font-semibold text-gray-600 hover:text-primary"><Edit size={14} className="mr-1" /> Edit</button></div>)}
                  </div>
                ) : (
                  <button onClick={() => handleGenerateJustification(item)} className="flex items-center text-sm font-medium text-white bg-primary px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"><Wand2 size={14} className="mr-2" /> Generate Justification</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BudgetAssistant;
