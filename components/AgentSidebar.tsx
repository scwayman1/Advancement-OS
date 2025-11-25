
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AGENTS } from '../constants';
import { AgentCategory, AppView, AgentDefinition } from '../types';
import { 
  LayoutGrid, Database, Users, HelpCircle, LogOut, CloudOff, CloudLightning, CheckCircle2,
  ChevronDown, Plus, Search, BarChart3, Database as DbIcon, Sparkles
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useMockBackend } from '../services/firebase';

interface AgentSidebarProps {
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

export const AgentSidebar: React.FC<AgentSidebarProps> = ({ 
  activeAgentId, 
  onSelectAgent, 
  currentView, 
  onViewChange 
}) => {
  const { user, logout, hasPermission } = useAuth();
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  
  // Hover State for Tooltip
  const [hoveredAgent, setHoveredAgent] = useState<AgentDefinition | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{top: number, left: number} | null>(null);

  // Group agents by category
  const groupedAgents = Object.values(AgentCategory).map((category) => ({
    category,
    agents: AGENTS.filter((a) => a.category === category),
  }));

  const handleRestartTour = () => {
      window.dispatchEvent(new Event('restart_onboarding_tour'));
  };

  useEffect(() => {
    const updateTime = () => setLastSaved(new Date());
    window.addEventListener('crm_updated', updateTime);
    return () => window.removeEventListener('crm_updated', updateTime);
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, agent: AgentDefinition) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
        top: rect.top,
        left: rect.right + 16 // 16px offset from sidebar
    });
    setHoveredAgent(agent);
  };

  const handleMouseLeave = () => {
      setHoveredAgent(null);
      setTooltipPos(null);
  };

  return (
    <aside className="flex w-72 flex-col bg-dark-nav text-text-light-on-dark p-4 shrink-0 h-full border-r border-slate-800 relative z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
           <LayoutGrid className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white text-lg font-bold leading-tight tracking-tight">AdvancementOS</h1>
          <p className="text-slate-400 text-xs font-normal">AI Fundraising Suite</p>
        </div>
      </div>

      {/* New Chat Button */}
      <button
        onClick={() => {
            onViewChange('chat');
            onSelectAgent(AGENTS[0].id);
        }}
        className="flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-4 bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-colors shadow-sm mb-4"
      >
        <Plus className="w-4 h-4" />
        <span className="truncate">New Chat</span>
      </button>

      {/* Core Navigation */}
      <nav className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-1">
        {/* View Switching Buttons */}
        <button
          onClick={() => onViewChange('crm')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left group ${
            currentView === 'crm' ? 'bg-dark-nav-hover text-white' : 'hover:bg-dark-nav-hover text-slate-300'
          }`}
        >
          <Database className={`w-5 h-5 ${currentView === 'crm' ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`} />
          <span className="text-sm font-medium">CRM Database</span>
        </button>

        {hasPermission('ADMIN') && (
          <button
            onClick={() => onViewChange('team')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left group ${
              currentView === 'team' ? 'bg-dark-nav-hover text-white' : 'hover:bg-dark-nav-hover text-slate-300'
            }`}
          >
            <Users className={`w-5 h-5 ${currentView === 'team' ? 'text-primary' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span className="text-sm font-medium">Team Settings</span>
          </button>
        )}

        <div className="h-px bg-slate-700/50 my-4 mx-2" />

        {/* Agent Accordions */}
        {groupedAgents.map((group) => (
          <details key={group.category} className="group" open>
            <summary className="flex cursor-pointer items-center justify-between gap-2 py-2 px-2 rounded-md hover:bg-dark-nav-hover transition-colors text-slate-300 select-none">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{group.category}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="pt-1 pb-3 space-y-0.5">
              {group.agents.map((agent) => {
                const isActive = currentView === 'chat' && activeAgentId === agent.id;
                const Icon = agent.icon;
                return (
                  <li key={agent.id}>
                    <button
                      onClick={() => {
                        onViewChange('chat');
                        onSelectAgent(agent.id);
                      }}
                      onMouseEnter={(e) => handleMouseEnter(e, agent)}
                      onMouseLeave={handleMouseLeave}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                        isActive
                          ? 'bg-dark-nav-hover text-white shadow-sm'
                          : 'hover:bg-dark-nav-hover text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-500'}`} />
                      <span className={`text-sm ${isActive ? 'font-medium' : 'font-normal'}`}>{agent.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-700 pt-4">
        <div className="flex items-center justify-between px-2 py-2">
           <div className="flex items-center gap-2">
              <img src={user?.avatarUrl} alt="User" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600" />
              <div className="overflow-hidden">
                  <div className="text-sm font-medium text-white truncate max-w-[100px]">{user?.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.title}</div>
              </div>
           </div>
           <div className="flex gap-1">
             <button 
                onClick={handleRestartTour}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" 
                title="Help"
             >
               <HelpCircle className="w-4 h-4" />
             </button>
             <button 
                onClick={logout} 
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors" 
                title="Sign Out"
             >
               <LogOut className="w-4 h-4" />
             </button>
           </div>
        </div>
        
        {/* System Status */}
        <div className={`mx-2 mt-1 py-1.5 px-3 rounded-md bg-slate-800/50 border border-slate-700 flex items-center justify-between text-[10px] ${useMockBackend ? 'text-amber-400' : 'text-emerald-400'}`}>
            <span className="flex items-center gap-1.5">
                {useMockBackend ? <CloudOff className="w-3 h-3" /> : <CloudLightning className="w-3 h-3" />}
                {useMockBackend ? 'Local Mode' : 'Cloud Synced'}
            </span>
            <span className="text-slate-500">{lastSaved.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      {/* Tooltip Portal */}
      {hoveredAgent && tooltipPos && createPortal(
          <div 
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            className="fixed z-50 w-72 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl p-4 text-left animate-in fade-in slide-in-from-left-2 duration-200 pointer-events-none"
          >
             <div className="flex items-center gap-3 mb-3">
                 <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                     <hoveredAgent.icon className="w-5 h-5 text-indigo-400" />
                 </div>
                 <div>
                     <h4 className="text-white font-bold text-sm">{hoveredAgent.name}</h4>
                     <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">{hoveredAgent.role}</span>
                 </div>
             </div>
             
             <p className="text-slate-300 text-xs leading-relaxed mb-4 border-b border-slate-700/50 pb-3">
                 {hoveredAgent.superpower}
             </p>

             <div className="flex gap-2">
                 {hoveredAgent.usesSearch && (
                     <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-medium">
                         <Search className="w-3 h-3" /> Web Search
                     </span>
                 )}
                  {hoveredAgent.visualizationType !== 'NONE' && (
                     <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-medium">
                         <BarChart3 className="w-3 h-3" /> Visualizer
                     </span>
                 )}
                 <span className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-medium">
                     <DbIcon className="w-3 h-3" /> CRM Access
                 </span>
             </div>
             
             {/* Decorative Arrow */}
             <div className="absolute top-6 -left-2 w-4 h-4 bg-slate-900 border-l border-b border-slate-700 rotate-45 transform" />
          </div>,
          document.body
      )}
    </aside>
  );
};
