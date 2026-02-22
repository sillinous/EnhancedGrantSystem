
export const getExpenses = (grantId: string) => { try { return JSON.parse(localStorage.getItem('gos_exp_'+grantId) || '[]'); } catch { return []; } };
export const addExpense = (grantId: string, e: any) => { const list = [...getExpenses(grantId), { id: Date.now(), ...e }]; localStorage.setItem('gos_exp_'+grantId, JSON.stringify(list)); };

export const deleteExpense = (grantId: string, id: number) => {
  const key = 'gos_exp_' + grantId;
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(items.filter((e: any) => e.id !== id)));
  } catch {}
};
export const updateExpense = (grantId: string, id: number, patch: any) => {
  const key = 'gos_exp_' + grantId;
  try {
    const items = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify(items.map((e: any) => e.id === id ? {...e,...patch} : e)));
  } catch {}
};
