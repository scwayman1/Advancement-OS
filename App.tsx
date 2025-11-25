
import React, { useState, useEffect } from 'react';
import { AgentSidebar } from './components/AgentSidebar';
import { ChatInterface } from './components/ChatInterface';
import { AgentVisualizer } from './components/AgentVisualizer';
import { CRMDashboard } from './components/CRMDashboard';
import { TeamSettings } from './components/TeamSettings';
import { Login } from './components/Login';
import { AuthProvider, useAuth } from './components/AuthContext';
import { OnboardingTour } from './components/OnboardingTour';
import { AGENTS } from './constants';
import { Message, ChatState, AppView, CRMEntity } from './types';
import { generateAgentResponse } from './services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { db } from './services/db';

const AppContent: React.FC = () => {
  const { user, isLoading: authLoading, organization } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [crmData, setCrmData] = useState<CRMEntity[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  
  // Global Context State
  const [selectedEntity, setSelectedEntity] = useState<CRMEntity | null>(null);

  // Tour State
  const [showTour, setShowTour] = useState(false);

  // Chat State
  const [state, setState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    activeAgentId: AGENTS[0].id,
  });

  // Contextual Chat State (for CRM "Reading Plane")
  const [isContextualChatOpen, setIsContextualChatOpen] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
        const tourCompleted = localStorage.getItem('advancement_os_tour_completed');
        if (!tourCompleted) {
            setTimeout(() => setShowTour(true), 1000);
        }
    }
  }, [user, authLoading]);

  const refreshCRM = async () => {
    if (!organization) return;
    setCrmLoading(true);
    try {
        const data = await db.getAll(organization.id);
        setCrmData(data);
    } catch (error) {
        console.error("Failed to fetch CRM data", error);
    } finally {
        setCrmLoading(false);
    }
  };

  useEffect(() => {
    if (user && organization) {
        refreshCRM();
    }
    const handleCRMUpdate = () => {
      if (organization) refreshCRM();
    };
    window.addEventListener('crm_updated', handleCRMUpdate);
    return () => {
      window.removeEventListener('crm_updated', handleCRMUpdate);
    };
  }, [user, organization]);

  useEffect(() => {
    const handleRestartTour = () => setShowTour(true);
    window.addEventListener('restart_onboarding_tour', handleRestartTour);
    return () => window.removeEventListener('restart_onboarding_tour', handleRestartTour);
  }, []);

  const handleTourComplete = () => {
    setShowTour(false);
    localStorage.setItem('advancement_os_tour_completed', 'true');
  };

  if (authLoading) {
      return <div className="flex h-screen w-full items-center justify-center bg-background-light text-slate-400 animate-pulse">Authenticating...</div>;
  }

  if (!user) {
      return <Login />;
  }

  const activeAgent = AGENTS.find((a) => a.id === state.activeAgentId) || AGENTS[0];

  const handleSelectAgent = (id: string) => {
    // 1. Set the active agent
    setState((prev) => ({
      ...prev,
      activeAgentId: id,
    }));

    // 2. Determine Navigation Behavior
    if (selectedEntity && currentView === 'crm') {
        // IF we are looking at a specific account, OPEN the side panel (Contextual Chat)
        // Do NOT navigate away from the CRM view
        setIsContextualChatOpen(true);
        
        // Optional: Clear previous messages if they weren't about this entity
        // setState(prev => ({ ...prev, messages: [] })); 
    } else {
        // IF we are just browsing generally, go to the main chat view
        setCurrentView('chat');
        setSelectedEntity(null); // Clear selection when going to global chat
        setIsContextualChatOpen(false);
    }
  };

  const handleSendMessage = async (text: string, agentIdOverride?: string) => {
    const targetAgentId = agentIdOverride || state.activeAgentId;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isTyping: true,
    }));

    try {
      const history = state.messages
        .filter(m => m.text && m.text.trim() !== '')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const result = await generateAgentResponse(
          targetAgentId, 
          history, 
          text,
          user.name,
          user.role,
          user.id,
          organization?.id,
          selectedEntity || undefined // PASS THE ACTIVE ACCOUNT CONTEXT
      );
      
      const modelMsgId = (Date.now() + 1).toString();
      const modelMsg: Message = {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date(),
        agentId: targetAgentId
      };
      
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, modelMsg],
        isTyping: false 
      }));

      let fullText = "";
      for await (const chunk of result) {
        const chunkText = (chunk as GenerateContentResponse).text;
        if (chunkText) {
            fullText += chunkText;
            setState((prev) => ({
                ...prev,
                messages: prev.messages.map((msg) =>
                msg.id === modelMsgId ? { ...msg, text: fullText } : msg
                ),
            }));
        }
      }

    } catch (error: any) {
      console.error("Agent Error:", error);
      setState((prev) => ({
        ...prev,
        isTyping: false,
        messages: [
          ...prev.messages,
          {
            id: Date.now().toString(),
            role: 'model',
            text: `**System Alert:** ${error.message || "An unknown error occurred while connecting to the Gemini API."}`,
            timestamp: new Date(),
            agentId: 'system'
          }
        ]
      }));
    }
  };

  const handleAgentAction = (agentId: string, prompt: string) => {
    setIsContextualChatOpen(true);
    // We don't need to call handleSelectAgent here because we want to override functionality manually
    setState((prev) => ({ ...prev, activeAgentId: agentId }));
    handleSendMessage(prompt, agentId);
  };

  const handleViewChange = (view: AppView) => {
      setCurrentView(view);
      if (view !== 'crm') {
          setIsContextualChatOpen(false);
          setSelectedEntity(null); // Clear selection when leaving CRM
      }
  };

  const handleEntitySelect = (entity: CRMEntity | null) => {
      setSelectedEntity(entity);
      if (!entity) {
          setIsContextualChatOpen(false);
      }
  };

  return (
    <div className="flex h-screen w-full bg-background-light font-display text-text-dark overflow-hidden">
      <OnboardingTour 
        isOpen={showTour && currentView !== 'team'} 
        onComplete={handleTourComplete} 
        onSkip={handleTourComplete} 
      />
      
      {/* Left Sidebar (Fixed Width) */}
      <AgentSidebar 
        activeAgentId={state.activeAgentId} 
        onSelectAgent={handleSelectAgent}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Main Grid Layout */}
      {/* Key Fix: min-h-0 prevents grid from expanding beyond viewport */}
      <main className="flex-1 grid grid-cols-12 overflow-hidden min-h-0">
        
        {currentView === 'chat' && (
          <>
            {/* Center Chat */}
            <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col h-full border-r border-slate-200 overflow-hidden min-h-0">
              <ChatInterface 
                messages={state.messages} 
                isTyping={state.isTyping} 
                onSendMessage={handleSendMessage}
                activeAgentName={activeAgent.name}
              />
            </div>
            
            {/* Right Visualizer */}
            <aside className="hidden lg:flex col-span-5 xl:col-span-4 flex-col h-full bg-white overflow-hidden min-h-0">
              <AgentVisualizer activeAgent={activeAgent} />
            </aside>
          </>
        )}
        
        {currentView === 'team' && (
           <div className="col-span-12 h-full flex flex-col overflow-hidden min-h-0">
              <TeamSettings />
           </div>
        )}

        {currentView === 'crm' && (
           <>
             {/* CRM takes full width, unless Context Chat is open */}
             {/* Key Fix: h-full and min-h-0 ensure scrollbars work */}
             <div className={`h-full flex flex-col transition-all duration-300 overflow-hidden min-h-0 ${isContextualChatOpen ? 'col-span-12 lg:col-span-7 xl:col-span-8' : 'col-span-12'}`}>
                <CRMDashboard 
                    data={crmData} 
                    isLoading={crmLoading} 
                    onAgentAction={handleAgentAction}
                    selectedEntity={selectedEntity}
                    onSelectEntity={handleEntitySelect}
                />
             </div>

             {/* Contextual Chat Panel (Reading Plane) */}
             {isContextualChatOpen && (
                 <aside className="hidden lg:flex col-span-5 xl:col-span-4 h-full border-l border-slate-200 shadow-xl z-20 flex-col bg-white overflow-hidden min-h-0">
                     <ChatInterface 
                        variant="sidebar"
                        messages={state.messages} 
                        isTyping={state.isTyping} 
                        onSendMessage={handleSendMessage}
                        activeAgentName={activeAgent.name}
                        activeEntityName={selectedEntity?.name} // Pass name for header
                        onClose={() => setIsContextualChatOpen(false)}
                    />
                 </aside>
             )}
           </>
        )}

      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
