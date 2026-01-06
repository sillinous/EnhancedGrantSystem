import { useState, useCallback, useEffect, RefObject } from 'react';
import { AIFieldType, AIContext, FieldCompletionResponse } from '../types';
import { generateFieldSuggestion } from '../services/aiAutoPopulateService';

export interface AIAutoPopulateConfig {
  fieldType: AIFieldType;
  context: AIContext;
  customPrompt?: string;
  onAccept: (text: string) => void;
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  enabled?: boolean;
}

export interface AIAutoPopulateState {
  isLoading: boolean;
  isPreviewOpen: boolean;
  suggestion: string;
  error: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
}

export interface AIAutoPopulateReturn {
  state: AIAutoPopulateState;
  triggerGeneration: () => Promise<void>;
  regenerate: () => Promise<void>;
  setSuggestion: (text: string) => void;
  acceptSuggestion: () => void;
  rejectSuggestion: () => void;
  closePreview: () => void;
}

export const useAIAutoPopulate = (config: AIAutoPopulateConfig): AIAutoPopulateReturn => {
  const { fieldType, context, customPrompt, onAccept, inputRef, enabled = true } = config;

  const [state, setState] = useState<AIAutoPopulateState>({
    isLoading: false,
    isPreviewOpen: false,
    suggestion: '',
    error: null,
    confidence: null
  });

  const getCurrentValue = useCallback((): string => {
    return inputRef.current?.value || '';
  }, [inputRef]);

  const triggerGeneration = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({
      ...prev,
      isLoading: true,
      isPreviewOpen: true,
      error: null
    }));

    try {
      const currentValue = getCurrentValue();
      const response: FieldCompletionResponse = await generateFieldSuggestion(
        fieldType,
        currentValue,
        context,
        customPrompt
      );

      setState(prev => ({
        ...prev,
        isLoading: false,
        suggestion: response.suggestion,
        confidence: response.confidence
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestion'
      }));
    }
  }, [enabled, fieldType, context, customPrompt, getCurrentValue]);

  const regenerate = useCallback(async () => {
    await triggerGeneration();
  }, [triggerGeneration]);

  const setSuggestion = useCallback((text: string) => {
    setState(prev => ({ ...prev, suggestion: text }));
  }, []);

  const acceptSuggestion = useCallback(() => {
    if (state.suggestion) {
      onAccept(state.suggestion);
    }
    setState(prev => ({
      ...prev,
      isPreviewOpen: false,
      suggestion: '',
      error: null,
      confidence: null
    }));
  }, [state.suggestion, onAccept]);

  const rejectSuggestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewOpen: false,
      suggestion: '',
      error: null,
      confidence: null
    }));
  }, []);

  const closePreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPreviewOpen: false
    }));
  }, []);

  // Keyboard shortcut: Ctrl+Space or Cmd+Space
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isShortcut = e.code === 'Space' && (isMac ? e.metaKey : e.ctrlKey);

      if (isShortcut && document.activeElement === inputRef.current) {
        e.preventDefault();
        e.stopPropagation();
        triggerGeneration();
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('keydown', handleKeyDown);
      return () => inputElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, inputRef, triggerGeneration]);

  // Close preview on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isPreviewOpen) {
        rejectSuggestion();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.isPreviewOpen, rejectSuggestion]);

  return {
    state,
    triggerGeneration,
    regenerate,
    setSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    closePreview
  };
};

export default useAIAutoPopulate;
