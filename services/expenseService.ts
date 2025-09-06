import { Expense, GrantOpportunity } from '../types';

const EXPENSES_KEY = 'grantfinder_expenses';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllExpenses = (): Record<string, Expense[]> => {
  try {
    const expensesJson = localStorage.getItem(EXPENSES_KEY);
    return expensesJson ? JSON.parse(expensesJson) : {};
  } catch (error) {
    console.error("Failed to parse expenses from localStorage", error);
    return {};
  }
};

const saveAllExpenses = (allExpenses: Record<string, Expense[]>): void => {
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(allExpenses));
  } catch (error) {
    console.error("Failed to save expenses to localStorage", error);
  }
};

export const getExpenses = (grant: GrantOpportunity): Expense[] => {
  if (!grant) return [];
  const grantId = getGrantId(grant);
  const allExpenses = getAllExpenses();
  return allExpenses[grantId] || [];
};

export const addExpense = (grant: GrantOpportunity, expenseData: Omit<Expense, 'id' | 'grantId'>): Expense => {
  const grantId = getGrantId(grant);
  const allExpenses = getAllExpenses();
  const grantExpenses = allExpenses[grantId] || [];
  const newExpense: Expense = {
    ...expenseData,
    id: Date.now(),
    grantId,
  };
  allExpenses[grantId] = [...grantExpenses, newExpense];
  saveAllExpenses(allExpenses);
  return newExpense;
};

export const deleteExpense = (grant: GrantOpportunity, expenseId: number): void => {
  const grantId = getGrantId(grant);
  const allExpenses = getAllExpenses();
  let grantExpenses = allExpenses[grantId] || [];
  allExpenses[grantId] = grantExpenses.filter(e => e.id !== expenseId);
  saveAllExpenses(allExpenses);
};