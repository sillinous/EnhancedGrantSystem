import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GrantOpportunity, FundingProfile, ChatMessage, GrantStatus, User, AppConfig } from '../types';
import * as geminiService from '../services/geminiService';
import { getConfig } from '../services/configService';
import * as usageService from '../services/usageService';
import FeatureGuard from './FeatureGuard';
import { Bot, User as UserIcon, Wand2, Send, Copy, Save, Check, FileBarChart2 } from 'lucide-react';

interface ChatAssistantProps {
  grant: GrantOpportunity & { status: GrantStatus };
  profile: FundingProfile;
  onSaveDraft: (section: string, content: string) => void;
  user: User;
}

const DraftMessageBlock: React.FC<{ message: ChatMessage; onSaveDraft: (section: string, content: string) => void; updateSavingState: (isSaved: boolean) => void; }> = ({ message, onSaveDraft, updateSavingState }) => {
    const [hasCopied, setHasCopied] = useState(false);
    const draft = message.draftContent;
    if (!draft) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(draft.content);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleSave = () => {
        onSaveDraft(draft.section, draft.content);
        updateSavingState(true); // Visually confirm save
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 to-blue-100 border border-primary/30 rounded-lg my-4 p-4 animate-fade-in shadow-sm">
            <h4 className="font-bold text-primary flex items-center text-lg mb-3">
                <Wand2 size={20} className="mr-2.5" />
                AI Grant Writing Studio: {draft.section}
            </h4>
            <p className="text-sm text-gray-800 whitespace-pre-wrap bg-white/80 p-4 rounded-md border border-gray-200 backdrop-blur-sm">{draft.content}</p>
            <div className="flex items-center gap-2 mt-4">
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-primary transition-colors px-3 py-1.5 rounded-md bg-white border border-gray-300 shadow-sm hover:shadow-md hover:border-primary/50">
                    {hasCopied ? <><Check size={14} className="text-green-600" /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
                </button>
                <button onClick={handleSave} disabled={message.isSaved} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md bg-white border border-primary/30 shadow-sm hover:shadow-md disabled:opacity-60 disabled:shadow-sm">
                    {message.isSaved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save to Drafts</>}
                </button>
            </div>
        </div>
    );
};

const ChatAssistant: React.FC<ChatAssistantProps> = ({ grant, profile, onSaveDraft, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForReportNotes, setWaitingForReportNotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [usage, setUsage] = useState({ remaining: 0, limit: 5 });

  const isAwarded = grant.status === 'Awarded';

  useEffect(() => {
    const welcomeMessage = isAwarded
      ? `Congratulations on your grant! I can help you draft progress reports. Use the Reporting Tools to begin.`
      : `Hi! I'm GrantBot. Ask a question, or use the Drafting Tools to get started.`;
    setMessages([{ sender: 'ai', text: welcomeMessage }]);
    setWaitingForReportNotes(false);

    const fetchConfigAndUsage = async () => {
        const appConfig = await getConfig();
        setConfig(appConfig);
        if (appConfig.monetizationModel === 'UsageBased') {
            // FIX: The `getUsage` service function requires a `userId` as the first argument.
            const usageData = await usageService.getUsage(user.id, 'AI Grant Writing Studio');
            setUsage(usageData);
        }
    };
    fetchConfigAndUsage();
  }, [grant, profile, isAwarded, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading || !config) return;
    const userMessage: ChatMessage = { sender: 'user', text: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (waitingForReportNotes) {
      if (config.monetizationModel === 'UsageBased') {
        // FIX: The `recordUsage` service function requires a `userId` as the first argument.
        await usageService.recordUsage(user.id, 'AI Grant Writing Studio');
        // FIX: The `getUsage` service function requires a `userId` as the first argument.
        setUsage(await usageService.getUsage(user.id, 'AI Grant Writing Studio'));
      }
      try {
        const draftContent = await geminiService.draftGrantReport(profile, grant, messageText);
        const draftMessage: ChatMessage = {
          sender: 'ai',
          type: 'draft',
          text: '',
          draftContent: { section: 'Progress Report', content: draftContent },
          isSaved: false,
        };
        setMessages(prev => [...prev, draftMessage]);
      } catch (e) {
        console.error(e);
        setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I couldn't draft the report. Please try again." }]);
      } finally {
        setWaitingForReportNotes(false);
        setIsLoading(false);
      }
    } else {
      try {
        const aiResponseText = await geminiService.sendMessageToChat(profile, grant, newMessages, messageText);
        const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
        setMessages(prev => [...prev, aiMessage]);
      } catch (e) {
        console.error(e);
        const errorMessage: ChatMessage = { sender: 'ai', text: "I'm sorry, I encountered an error. Please try again." };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [isLoading, messages, config, waitingForReportNotes, profile, grant]);

  const handleDraftRequest = useCallback(async (section: string) => {
    if (isLoading || !config) return;
    
    if (config.monetizationModel === 'UsageBased') {
      // FIX: The `getUsage` service function requires a `userId` as the first argument.
      const currentUsage = await usageService.getUsage(user.id, 'AI Grant Writing Studio');
      if (currentUsage.remaining <= 0) return;
      // FIX: The `recordUsage` service function requires a `userId` as the first argument.
      await usageService.recordUsage(user.id, 'AI Grant Writing Studio');
      // FIX: The `getUsage` service function requires a `userId` as the first argument.
      setUsage(await usageService.getUsage(user.id, 'AI Grant Writing Studio'));
    }

    setIsLoading(true);
    setMessages(prev => [...prev, { sender: 'user', text: `Draft a section for: ${section}` }]);

    try {
        const teamId = profile.owner.type === 'team' ? profile.owner.id : undefined;
        const draftContent = await geminiService.draftGrantSection(profile, grant, section, teamId);
        const draftMessage: ChatMessage = {
            sender: 'ai',
            text: '',
            type: 'draft',
            draftContent: { section, content: draftContent },
            isSaved: false
        };
        setMessages(prev => [...prev, draftMessage]);
    } catch(e) {
        console.error(e);
        const errorMessage: ChatMessage = { sender: 'ai', text: `I'm sorry, I couldn't draft the ${section}. Please try again.` };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }, [isLoading, profile, grant, config]);
  
  const handleReportRequest = async (section: string) => {
    if (isLoading || !config) return;

    if (config.monetizationModel === 'UsageBased') {
      // FIX: The `getUsage` service function requires a `userId` as the first argument.
      const currentUsage = await usageService.getUsage(user.id, 'AI Grant Writing Studio');
      if (currentUsage.remaining <= 0) return;
    }
    
    const promptMessage: ChatMessage = {
      sender: 'ai',
      type: 'prompt',
      text: `Great! To help me draft the ${section}, please provide some bullet points on your progress, any data you've collected, and milestones you've hit.`,
    };
    setMessages(prev => [...prev, { sender: 'user', text: `Help me draft a ${section}.` }, promptMessage]);
    setWaitingForReportNotes(true);
  };

  const updateMessageSavingState = (index: number, isSaved: boolean) => {
    setMessages(prev => prev.map((msg, i) => i === index ? { ...msg, isSaved } : msg));
  };

  const draftingTools = ["Executive Summary", "Statement of Need", "Project Goals & Objectives", "Methods & Activities", "Evaluation Plan", "Budget Narrative"];
  const reportingTools = ["Progress Report", "Financial Summary"];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto border border-gray-200 mb-4">
        {messages.map((msg, index) => {
           if (msg.type === 'draft') {
               return <DraftMessageBlock key={index} message={msg} onSaveDraft={onSaveDraft} updateSavingState={(isSaved) => updateMessageSavingState(index, isSaved)} />;
           }
           return (
              <div key={index} className={`flex items-start gap-2.5 my-4 animate-fade-in ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && (
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white"><Bot size={18} /></span>
                )}
                <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-primary text-white' : (msg.type === 'prompt' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-white text-gray-700 border border-gray-200')}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sender === 'user' && (
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-600"><UserIcon size={18} /></span>
                )}
              </div>
           );
        })}
         {isLoading && !waitingForReportNotes && (
            <div className="flex items-start gap-2.5 my-2">
                <span className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white"><Bot size={18} /></span>
                <div className="p-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t pt-4">
        <FeatureGuard user={user} featureName="AI Grant Writing Studio">
            <div className="flex justify-between items-center mb-2 px-1">
                <p className="text-xs font-semibold text-gray-500">{isAwarded ? 'AI REPORTING STUDIO' : 'AI GRANT WRITING STUDIO'}</p>
                {config?.monetizationModel === 'UsageBased' && user.role !== 'Admin' && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {usage.remaining}/{usage.limit} Free Drafts Remaining
                    </span>
                )}
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
                {isAwarded ? (
                    reportingTools.map(tool => (
                        <button key={tool} onClick={() => handleReportRequest(tool)} disabled={isLoading} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:bg-gray-100">
                            <FileBarChart2 size={14} className="text-primary/70" />
                            {tool}
                        </button>
                    ))
                ) : (
                    draftingTools.map(tool => (
                        <button key={tool} onClick={() => handleDraftRequest(tool)} disabled={isLoading} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:bg-gray-100">
                            <Wand2 size={14} className="text-primary/70" />
                            {tool}
                        </button>
                    ))
                )}
            </div>
        </FeatureGuard>
          <div className="flex items-center gap-2">
            <input
              type={waitingForReportNotes ? "textarea" : "text"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
              placeholder={waitingForReportNotes ? "Enter your progress notes here..." : "Ask a follow-up question..."}
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-primary text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
