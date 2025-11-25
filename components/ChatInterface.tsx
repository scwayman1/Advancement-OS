
import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { Send, Loader2, Sparkles, X, Paperclip, ArrowUp, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AGENTS } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  activeAgentName: string;
  activeEntityName?: string; // New prop for context
  variant?: 'full' | 'sidebar';
  onClose?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping,
  onSendMessage,
  activeAgentName,
  activeEntityName,
  variant = 'full',
  onClose
}) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const isSidebar = variant === 'sidebar';
  const activeAgent = AGENTS.find(a => a.name === activeAgentName);
  const AgentIcon = activeAgent?.icon || Sparkles;

  return (
    <div className={`flex flex-col h-full relative ${isSidebar ? 'bg-white' : 'bg-background-light'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-lg ${isSidebar ? 'h-14 px-4' : 'h-16 px-6'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${isSidebar ? 'bg-indigo-50' : 'bg-indigo-50'}`}>
             <AgentIcon className={`text-primary ${isSidebar ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </div>
          <div className="flex flex-col">
              <h2 className={`font-semibold text-text-dark ${isSidebar ? 'text-sm' : 'text-base'}`}>{activeAgentName}</h2>
              {activeEntityName && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <Briefcase className="w-3 h-3" />
                      Context: {activeEntityName}
                  </span>
              )}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-medium text-emerald border border-emerald/20 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></span>
            Active
          </span>
        </div>
        {isSidebar && onClose && (
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                <X className="w-4 h-4" />
            </button>
        )}
      </header>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto space-y-6 scroll-smooth min-h-0 ${isSidebar ? 'p-4' : 'p-6'}`}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="bg-indigo-50 p-4 rounded-full mb-4">
                 <AgentIcon className={`${isSidebar ? 'w-6 h-6' : 'w-10 h-10'} text-primary`} />
            </div>
            <p className={`${isSidebar ? 'text-sm text-center px-4' : 'text-lg font-medium'}`}>
                {activeEntityName 
                    ? `Ready to work on ${activeEntityName}. How can I help?` 
                    : "How can I advance your mission today?"}
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && !isSidebar && (
               <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                 <AgentIcon className="w-5 h-5 text-primary" />
               </div>
            )}
            
            <div className={`max-w-[85%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`text-xs font-medium ${msg.role === 'user' ? 'text-slate-500' : 'text-primary'}`}>
                    {msg.role === 'user' ? 'You' : activeAgentName}
                </div>
                <div
                className={`rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                    msg.role === 'user'
                    ? 'bg-primary text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-text-dark rounded-tl-sm'
                }`}
                >
                {msg.role === 'model' ? (
                    <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed prose-headings:text-slate-800 prose-a:text-indigo-600">
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
                </div>
                <div className="text-[10px] text-slate-400 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            {msg.role === 'user' && !isSidebar && (
                 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-tr from-slate-400 to-slate-300" />
                 </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-end gap-3">
             {!isSidebar && (
                 <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <AgentIcon className="w-5 h-5 text-primary" />
                 </div>
             )}
            <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t border-slate-200 ${isSidebar ? 'bg-white' : 'bg-background-light'}`}>
        <div className="relative max-w-4xl mx-auto bg-white rounded-xl border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
            <form onSubmit={handleSubmit} className="flex flex-col">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    placeholder={activeEntityName ? `Message ${activeAgentName} about ${activeEntityName}...` : `Message ${activeAgentName}...`}
                    className="w-full min-h-[50px] max-h-[120px] p-3 pr-24 bg-transparent border-none focus:ring-0 text-sm resize-none placeholder:text-slate-400 text-slate-800"
                    rows={1}
                />
                <div className="flex items-center justify-between px-2 pb-2">
                     <button type="button" className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-lg transition-colors">
                        <Paperclip className="w-4 h-4" />
                     </button>
                     <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
