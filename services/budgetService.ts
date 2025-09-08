import { BudgetItem, GrantOpportunity } from '../types';

const BUDGET_KEY = 'grantfinder_budgetItems';

// Helper to create a consistent, unique key for a grant.
const getGrantId = (grant: GrantOpportunity): string => {
  const safeName = grant.name.replace(/[^a-zA-Z0-9]/g, '');
  const safeUrl = grant.url.replace(/[^a-zA-Z0-9]/g, '');
  return `grant_${safeName}_${safeUrl}`.slice(0, 75);
};

const getAllBudgetItems = (): Record<string, BudgetItem[]> => {
  try {
    const itemsJson = localStorage.getItem(BUDGET_KEY);
    return itemsJson ? JSON.parse(itemsJson) : {};
  } catch (error) {
    console.error("Failed to parse budget items from localStorage", error);
    return {};
  }
};

const saveAllBudgetItems = (allItems: Record<string, BudgetItem[]>): void => {
  try {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(allItems));
  } catch (error) {
    console.error("Failed to save budget items to localStorage", error);
  }
};

export const getBudgetItems = (grant: GrantOpportunity): BudgetItem[] => {
  if (!grant) return [];
  const grantId = getGrantId(grant);
  const allItems = getAllBudgetItems();
  return allItems[grantId] || [];
};

export const addBudgetItem = (grant: GrantOpportunity, itemData: { description: string; amount: number }): BudgetItem => {
  const grantId = getGrantId(grant);
  const allItems = getAllBudgetItems();
  const grantItems = allItems[grantId] || [];
  const newItem: BudgetItem = {
    ...itemData,
    id: Date.now(),
    grantId,
    justification: '', // Start with an empty justification
  };
  allItems[grantId] = [...grantItems, newItem];
  saveAllBudgetItems(allItems);
  return newItem;
};

export const updateBudgetItem = (grant: GrantOpportunity, updatedItem: BudgetItem): void => {
  const grantId = getGrantId(grant);
  const allItems = getAllBudgetItems();
  let grantItems = allItems[grantId] || [];
  grantItems = grantItems.map(item => item.id === updatedItem.id ? updatedItem : item);
  allItems[grantId] = grantItems;
  saveAllBudgetItems(allItems);
};


export const deleteBudgetItem = (grant: GrantOpportunity, itemId: number): void => {
  const grantId = getGrantId(grant);
  const allItems = getAllBudgetItems();
  let grantItems = allItems[grantId] || [];
  allItems[grantId] = grantItems.filter(e => e.id !== itemId);
  saveAllBudgetItems(allItems);
};
