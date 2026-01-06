import React, { useRef, useCallback } from 'react';
import { Wand2 } from 'lucide-react';
import { AIFieldType, AIContext, User } from '../types';
import { useAIAutoPopulate } from '../hooks/useAIAutoPopulate';
import AIPreviewPopup from './AIPreviewPopup';
import FeatureGuard from './FeatureGuard';

export interface AIEnhancedInputProps {
  // Standard input props
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;

  // AI configuration
  aiConfig: {
    fieldType: AIFieldType;
    context: AIContext;
    customPrompt?: string;
    featureName?: string;
  };

  // User for subscription checking (optional - if not provided, AI button always shows)
  user?: User | null;

  // Whether to use textarea instead of input
  multiline?: boolean;

  // Additional wrapper class
  wrapperClassName?: string;
}

const AIEnhancedInput: React.FC<AIEnhancedInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 3,
  required,
  disabled,
  name,
  id,
  aiConfig,
  user,
  multiline = false,
  wrapperClassName = ''
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleAccept = useCallback((suggestion: string) => {
    onChange(suggestion);
  }, [onChange]);

  const {
    state,
    triggerGeneration,
    regenerate,
    setSuggestion,
    acceptSuggestion,
    rejectSuggestion
  } = useAIAutoPopulate({
    fieldType: aiConfig.fieldType,
    context: { ...aiConfig.context, currentValue: value },
    customPrompt: aiConfig.customPrompt,
    onAccept: handleAccept,
    inputRef: inputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement>,
    enabled: !disabled
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const baseInputClasses = `
    w-full px-3 py-2 pr-10
    border border-gray-300 rounded-lg
    shadow-sm text-sm
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:text-gray-500
    transition-all
  `.trim();

  const inputClasses = `${baseInputClasses} ${className}`;

  const AIButton = (
    <button
      type="button"
      onClick={triggerGeneration}
      disabled={disabled || state.isLoading}
      className={`
        absolute right-2 top-1/2 -translate-y-1/2
        p-1.5 rounded-md
        text-gray-400 hover:text-blue-600 hover:bg-blue-50
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${state.isLoading ? 'animate-pulse' : ''}
        ${multiline ? 'top-3 translate-y-0' : ''}
      `}
      title="AI Auto-Fill (Ctrl+Space)"
      aria-label="Generate AI suggestion"
    >
      <Wand2 size={16} className={state.isLoading ? 'animate-spin' : ''} />
    </button>
  );

  const renderInput = () => {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={inputClasses}
          rows={rows}
          required={required}
          disabled={disabled}
          name={name}
          id={id}
        />
      );
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={inputClasses}
        required={required}
        disabled={disabled}
        name={name}
        id={id}
      />
    );
  };

  const renderWithFeatureGuard = () => {
    if (user && aiConfig.featureName) {
      return (
        <FeatureGuard user={user} featureName={aiConfig.featureName}>
          {AIButton}
        </FeatureGuard>
      );
    }
    return AIButton;
  };

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName}`}>
      {renderInput()}
      {renderWithFeatureGuard()}

      <AIPreviewPopup
        isOpen={state.isPreviewOpen}
        suggestion={state.suggestion}
        isLoading={state.isLoading}
        error={state.error}
        confidence={state.confidence}
        anchorRef={wrapperRef}
        onSuggestionChange={setSuggestion}
        onAccept={acceptSuggestion}
        onReject={rejectSuggestion}
        onRegenerate={regenerate}
      />
    </div>
  );
};

export default AIEnhancedInput;
