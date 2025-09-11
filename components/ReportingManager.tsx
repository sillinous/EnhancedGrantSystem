
import React, { useState, useEffect, useMemo } from 'react';
import { GrantOpportunity, ReportingRequirement, Expense } from '../types';
import * as reportingService from '../services/reportingService';
import * as expenseService from '../services/expenseService';
import { createCalendarFile } from '../services/calendarService';
import { Calendar, DollarSign, Plus, Trash2, CheckSquare, Square, CalendarPlus } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ReportingManagerProps {
  grant: GrantOpportunity;
}

const getGrantId = (grant: GrantOpportunity): string => {
    return `${grant.name}_${grant.url}`.replace(/[^a-zA-Z0-9]/g, '');
};

const ReportingManager: React.FC<ReportingManagerProps> = ({ grant }) => {
  const [requirements, setRequirements] = useState<ReportingRequirement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newReqDesc, setNewReqDesc] = useState('');
  const [newReqDate, setNewReqDate] = useState('');
  
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState('');
  
  const grantId = getGrantId(grant);

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [reqs, exps] = await Promise.all([
                reportingService.getRequirements(grantId),
                expenseService.getExpenses(grantId)
            ]);
            setRequirements(reqs);
            setExpenses(exps);
        } catch (error) {
            console.error("Failed to load reporting data", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, [grantId]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + Number(expense.amount), 0), [expenses]);
  const grantFundingAmount = useMemo(() => parseFloat(grant.fundingAmount.replace(/[^0-9.-]+/g,"")) || 0, [grant.fundingAmount]);
  const fundsUsedPercentage = useMemo(() => grantFundingAmount === 0 ? 0 : (totalExpenses / grantFundingAmount) * 100, [totalExpenses, grantFundingAmount]);

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqDesc.trim() || !newReqDate) return;
    await reportingService.addRequirement(grantId, { description: newReqDesc, dueDate: newReqDate });
    setRequirements(await reportingService.getRequirements(grantId));
    setNewReqDesc('');
    setNewReqDate('');
  };

  const handleToggleRequirement = async (req: ReportingRequirement) => {
    const updatedReq = { ...req, completed: !req.completed };
    await reportingService.updateRequirement(grantId, updatedReq);
    setRequirements(await reportingService.getRequirements(grantId));
  };
  
  const handleDeleteRequirement = async (reqId: number) => {
    await reportingService.deleteRequirement(grantId, reqId);
    setRequirements(await reportingService.getRequirements(grantId));
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc.trim() || !newExpenseAmount || !newExpenseDate) return;
    await expenseService.addExpense(grantId, { description: newExpenseDesc, amount: parseFloat(newExpenseAmount), date: newExpenseDate });
    setExpenses(await expenseService.getExpenses(grantId));
    setNewExpenseDesc('');
    setNewExpenseAmount('');
    setNewExpenseDate('');
  };

  const handleDeleteExpense = async (expenseId: number) => {
    await expenseService.deleteExpense(grantId, expenseId);
    setExpenses(await expenseService.getExpenses(grantId));
  };

  if (isLoading) return <LoadingSpinner message="Loading reporting dashboard..." />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><DollarSign size={20} className="mr-2" /> Financial Summary</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center text-sm mb-2"><span className="font-medium text-gray-600">Funds Utilized</span><span className="font-bold text-gray-800">${totalExpenses.toLocaleString()} of ${grantFundingAmount.toLocaleString()}</span></div>
          <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.min(fundsUsedPercentage, 100)}%` }}></div></div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><Calendar size={20} className="mr-2" /> Reporting Deadlines</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
          <form onSubmit={handleAddRequirement} className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={newReqDesc} onChange={e => setNewReqDesc(e.target.value)} placeholder="New report description" className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-md" required />
            <input type="date" value={newReqDate} onChange={e => setNewReqDate(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-md" required />
            <button type="submit" className="p-2 bg-primary text-white rounded-md hover:bg-blue-700"><Plus size={20} /></button>
          </form>
           <ul className="space-y-2">{requirements.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(req => (<li key={req.id} className="flex items-center justify-between p-2 group rounded-md hover:bg-gray-50"><div className="flex items-center cursor-pointer flex-grow" onClick={() => handleToggleRequirement(req)}>{req.completed ? <CheckSquare size={18} className="text-green-600 mr-3" /> : <Square size={18} className="text-gray-400 mr-3" />}<div className={req.completed ? 'text-gray-500 line-through' : ''}><p className="text-sm font-medium">{req.description}</p><p className="text-xs text-gray-500">{new Date(req.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p></div></div><div className="flex items-center gap-1 opacity-0 group-hover:opacity-100"><a href={createCalendarFile(`Reporting: ${req.description}`, `Reporting deadline for grant "${grant.name}".`, req.dueDate)} download={`${grant.name} - Reporting Deadline.ics`} className="p-1.5 text-primary hover:bg-primary/10 rounded-full" title="Add to Calendar"><CalendarPlus size={16}/></a><button onClick={() => handleDeleteRequirement(req.id)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button></div></li>))}</ul>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><DollarSign size={20} className="mr-2" /> Expense Log</h3>
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
           <form onSubmit={handleAddExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
              <input type="text" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} placeholder="Expense description" className="sm:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-md" required />
              <div className="flex gap-2"><input type="number" value={newExpenseAmount} onChange={e => setNewExpenseAmount(e.target.value)} placeholder="Amount" className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md" required /><input type="date" value={newExpenseDate} onChange={e => setNewExpenseDate(e.target.value)} className="w-1/2 px-3 py-2 text-sm border border-gray-300 rounded-md" required /></div>
               <button type="submit" className="sm:col-span-3 w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700">Add Expense</button>
           </form>
           <ul className="space-y-1 max-h-48 overflow-y-auto pr-2">{expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (<li key={exp.id} className="flex items-center justify-between p-2 group rounded-md hover:bg-gray-50"><div><p className="text-sm font-medium">{exp.description}</p><p className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</p></div><div className="flex items-center gap-2"><span className="text-sm font-mono">${Number(exp.amount).toLocaleString()}</span><button onClick={() => handleDeleteExpense(exp.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button></div></li>))}</ul>
        </div>
      </div>
    </div>
  );
};

export default ReportingManager;
