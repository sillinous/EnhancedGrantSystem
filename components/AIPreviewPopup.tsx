import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, RefreshCw, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface AIPreviewPopupProps {
  isOpen: boolean;
  suggestion: string;
  isLoading: boolean;
  error: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSuggestionChange: (text: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
}

const AIPreviewPopup: React.FC<AIPreviewPopupProps> = ({
  isOpen,
  suggestion,
  isLoading,
  error,
  confidence,
  anchorRef,
  onSuggestionChange,
  onAccept,
  onReject,
  onRegenerate
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Position the popup below the anchor element
  useEffect(() => {
    if (isOpen && anchorRef.current && popupRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popup = popupRef.current;

      popup.style.position = 'fixed';
      popup.style.top = `${anchorRect.bottom + 8}px`;
      popup.style.left = `${anchorRect.left}px`;
      popup.style.width = `${Math.max(anchorRect.width, 320)}px`;
      popup.style.maxWidth = '500px';

      // Check if popup would go off-screen and adjust
      const popupRect = popup.getBoundingClientRect();
      if (popupRect.bottom > window.innerHeight) {
        popup.style.top = `${anchorRect.top - popupRect.height - 8}px`;
      }
      if (popupRect.right > window.innerWidth) {
        popup.style.left = `${window.innerWidth - popupRect.width - 16}px`;
      }
    }
  }, [isOpen, anchorRef, suggestion]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && suggestion) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [suggestion]);

  // Focus textarea when popup opens with content
  useEffect(() => {
    if (isOpen && !isLoading && suggestion && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isOpen, isLoading, suggestion]);

  // Handle Enter key to accept (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      onAccept();
    }
  };

  if (!isOpen) return null;

  const confidenceColors = {
    high: 'text-green-600',
    medium: 'text-yellow-600',
    low: 'text-orange-500'
  };

  const popupContent = (
    <div
      ref={popupRef}
      className="z-50 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in"
      role="dialog"
      aria-label="AI Suggestion Preview"
    >
      {/* Header */}
      <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">AI Suggestion</span>
          {confidence && !isLoading && (
            <span className={`text-xs ${confidenceColors[confidence]}`}>
              ({confidence} confidence)
            </span>
          )}
        </div>
        <button
          onClick={onReject}
          className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="py-8">
            <LoadingSpinner message="Generating suggestion..." size="small" />
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Generation Failed</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={suggestion}
            onChange={(e) => onSuggestionChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="AI suggestion will appear here..."
            rows={3}
          />
        )}

        {/* Hint text */}
        {!isLoading && !error && suggestion && (
          <p className="text-xs text-gray-500 mt-2">
            Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Enter</kbd> to accept,{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">Esc</kbd> to cancel
          </p>
        )}
      </div>

      {/* Footer with actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
        <button
          onClick={onRegenerate}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Regenerate
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={onAccept}
            disabled={isLoading || !suggestion}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={14} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );

  // Render using portal to escape parent overflow constraints
  return createPortal(popupContent, document.body);
};

export default AIPreviewPopup;
