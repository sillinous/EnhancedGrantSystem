import { AIFieldType, AIContext, FieldCompletionRequest, FieldCompletionResponse } from '../types';
import { getToken } from './authService';

const API_URL = 'http://localhost:3001/api';

export const generateFieldSuggestion = async (
  fieldType: AIFieldType,
  currentValue: string,
  context: AIContext,
  customPrompt?: string
): Promise<FieldCompletionResponse> => {
  const token = getToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const request: FieldCompletionRequest = {
    fieldType,
    currentValue,
    context,
    customPrompt
  };

  try {
    const response = await fetch(`${API_URL}/ai/field-completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to generate suggestion' }));
      throw new Error(error.message || 'Failed to generate suggestion');
    }

    return await response.json();
  } catch (error) {
    console.error('AI field completion error:', error);
    throw error;
  }
};

// Field type display names for UI
export const fieldTypeLabels: Record<AIFieldType, string> = {
  profile_name: 'Organization Name',
  profile_description: 'Profile Description',
  funding_needs: 'Funding Needs',
  industry: 'Industry/Focus Area',
  budget_description: 'Budget Item',
  budget_justification: 'Budget Justification',
  checklist_item: 'Task Item',
  draft_content: 'Draft Content',
  document_name: 'Document Name',
  report_description: 'Report Description',
  expense_description: 'Expense Description',
  team_name: 'Team Name',
  feedback_message: 'Feedback',
  generic: 'Content'
};
