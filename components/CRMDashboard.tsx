
import React, { useState } from 'react';
import { AGENTS } from '../constants';
import { CRMEntity, CRMEntityType } from '../types';
import { 
  Building2, Users, User, BookOpen, MoreHorizontal, 
  TrendingUp, Tag, Search, BrainCircuit, Database, Loader2,
  ArrowLeft, Briefcase, Sparkles, Map, Gift, Mail, Target,
  MessageSquare, Zap
} from 'lucide-react';

interface CRMDashboardProps {
  data: CRMEntity[];
  isLoading?: boolean;
  onAgentAction: (agentId: string, prompt: string) => void;
  // Controlled Component Props
  selectedEntity: CRMEntity | null;
  onSelectEntity: (entity: CRMEntity | null) => void;
}

export const CRMDashboard: React.FC<CRMDashboardProps> = ({ 
  data, 
  isLoading = false, 
  onAgentAction,
  selectedEntity,
  onSelectEntity
}) => {
  const [activeTab, setActiveTab] = useState<'All' | CRMEntityType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Safety check: Ensure data is an array before filtering
  const safeData = Array.isArray(data) ? data : [];

  const filteredData = safeData.filter(item => {
    // 1. Filter by Tab (Type)
    if (activeTab !== 'All' && item.type !== activeTab) {
      return false;
    }

    // 2. Filter by Search Query
    if (!searchQuery.trim()) {
      return true;
    }

    const query = searchQuery.toLowerCase();
    const nameMatch = item.name?.toLowerCase().includes(query) || false;
    const statusMatch = item.status?.toLowerCase().includes(query) || false;
    const tagsMatch = item.tags && Array.isArray(item.tags) 
      ? item.tags.some(tag => tag.toLowerCase().includes(query))
      : false;
    const orgMatch = item.organization?.toLowerCase().includes(query) || false;

    return nameMatch || statusMatch || tagsMatch || orgMatch;
  });

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-slate-100 text-slate-600';
    switch (status) {
      case 'Identified': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Qualification': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cultivation': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Solicitation': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Stewardship': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getAgentName = (id: string) => {
    const agent = AGENTS.find(a => a.id === id);
    return agent ? agent.name : id;
  };

  // --- DETAIL VIEW COMPONENT ---
  if (selectedEntity) {
    const safeTags = Array.isArray(selectedEntity.tags) ? selectedEntity.tags : [];
    const safeStatus = selectedEntity.status || 'Identified';

    return (
        <div className="flex-1 bg-slate-50 h-full flex flex-col overflow-hidden min-h-0">
            {/* Detail Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex-shrink-0">
                <button 
                    onClick={() => onSelectEntity(null)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-4 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Pipeline
                </button>
                
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-5">
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                            selectedEntity.type === 'Corporation' ? 'bg-blue-50 text-blue-600' :
                            selectedEntity.type === 'Foundation' ? 'bg-purple-50 text-purple-600' :
                            selectedEntity.type === 'Individual' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-amber-50 text-amber-600'
                        }`}>
                            {selectedEntity.type === 'Corporation' && <Building2 className="w-8 h-8" />}
                            {selectedEntity.type === 'Foundation' && <BookOpen className="w-8 h-8" />}
                            {selectedEntity.type === 'Individual' && <User className="w-8 h-8" />}
                            {selectedEntity.type === 'Contact' && <Users className="w-8 h-8" />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{selectedEntity.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusColor(safeStatus)}`}>
                                    {safeStatus}
                                </span>
                                {selectedEntity.organization && (
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4 text-slate-400" />
                                        {selectedEntity.role ? `${selectedEntity.role} at ` : ''}{selectedEntity.organization}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Capacity</div>
                         <div className="text-xl font-bold text-slate-800">{selectedEntity.capacity || 'Unknown'}</div>
                    </div>
                </div>
            </div>

            {/* Detail Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 pb-24">
                
                {/* Status Pipeline */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-6">Pipeline Progress</h3>
                    <div className="flex items-center justify-between relative">
                         {/* Line */}
                         <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 -z-0" />
                         
                         {['Identified', 'Qualification', 'Cultivation', 'Solicitation', 'Stewardship'].map((step, idx) => {
                            const currentIdx = ['Identified', 'Qualification', 'Cultivation', 'Solicitation', 'Stewardship'].indexOf(safeStatus);
                            const isCompleted = idx <= (currentIdx === -1 ? 0 : currentIdx);
                            const isCurrent = idx === (currentIdx === -1 ? 0 : currentIdx);

                            return (
                                <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                                        isCompleted 
                                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                                            : 'bg-white border-slate-300 text-slate-300'
                                    }`}>
                                        {isCompleted && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                    <span className={`text-xs font-medium ${isCurrent ? 'text-indigo-700 font-bold' : 'text-slate-500'}`}>
                                        {step}
                                    </span>
                                </div>
                            );
                         })}
                    </div>
                </div>

                {/* Context & Next Steps */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <Target className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-800">Current Trajectory</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Last Action</div>
                                <p className="text-slate-700 font-medium">{selectedEntity.lastAction || 'No action recorded'}</p>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Next Recommended Step</div>
                                <p className="text-slate-700 font-medium">{selectedEntity.nextStep || 'Awaiting agent analysis'}</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="text-xs text-slate-400 font-bold uppercase mb-2">Tags & Interests</div>
                            <div className="flex flex-wrap gap-2">
                                {safeTags.map(tag => (
                                    <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded border border-slate-200">
                                        {tag}
                                    </span>
                                ))}
                                {safeTags.length === 0 && <span className="text-slate-400 text-sm italic">No tags added yet</span>}
                            </div>
                        </div>
                    </div>

                     <div className="bg-indigo-900 rounded-xl border border-indigo-800 p-6 shadow-sm text-white flex flex-col justify-center items-center text-center relative overflow-hidden min-h-[180px]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-400" />
                        <div className="relative z-10">
                            <div className="text-4xl font-bold mb-1">{selectedEntity.alignmentScore || 0}%</div>
                            <div className="text-indigo-200 text-sm font-medium uppercase tracking-wide">Alignment Score</div>
                            <p className="text-xs text-indigo-300 mt-4 leading-relaxed">
                                Based on capacity, philanthropic history, and program affinity.
                            </p>
                        </div>
                        <BrainCircuit className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-800 opacity-50" />
                    </div>
                </div>

                {/* Agent Command Center */}
                <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Start Work Session
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {/* Universal Actions */}
                        <button 
                            onClick={() => onAgentAction('sherlock', `Conduct a deep-dive research dossier on ${selectedEntity.name}. Focus on recent news, financial performance, and philanthropic indicators. We are currently in the ${safeStatus} phase.`)}
                            className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                        >
                             <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                INTELLIGENCE
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Search className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                            </div>
                            <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Sherlock Research</div>
                            <div className="text-xs text-slate-400">Run deep-dive dossier</div>
                        </button>

                        {/* Corporate Actions */}
                        {selectedEntity.type === 'Corporation' && (
                            <>
                                <button 
                                    onClick={() => onAgentAction('rainmaker', `Draft a corporate partnership pitch for ${selectedEntity.name}. Focus on our talent pipeline and alignment with their industry. Status is ${safeStatus}.`)}
                                    className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                                >
                                     <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        STRATEGY
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <Building2 className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Partnership Pitch</div>
                                    <div className="text-xs text-slate-400">Draft one-pager & value prop</div>
                                </button>
                                <button 
                                    onClick={() => onAgentAction('loop_builder', `Create an Endowment Loop ROI model for ${selectedEntity.name}. Assume a $1M investment. Calculate training savings and long-term endowment growth.`)}
                                    className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                                >
                                     <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        FINANCE
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <TrendingUp className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Build Loop Model</div>
                                    <div className="text-xs text-slate-400">Visualize ROI & Pipeline</div>
                                </button>
                                 <button 
                                    onClick={() => onAgentAction('alliance_agent', `Find the contact information for the Chief HR Officer, Director of Talent, or VP of CSR at ${selectedEntity.name}.`)}
                                    className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        OUTREACH
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <Users className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Find Contacts</div>
                                    <div className="text-xs text-slate-400">Identify key decision makers</div>
                                </button>
                            </>
                        )}

                        {/* Individual Actions */}
                        {selectedEntity.type === 'Individual' && (
                            <>
                                <button 
                                    onClick={() => onAgentAction('steward', `Draft a personalized cultivation email to ${selectedEntity.name}. Reference their recent ${selectedEntity.lastAction || 'interaction'} if relevant, and propose the next step: ${selectedEntity.nextStep}.`)}
                                    className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        RELATIONSHIPS
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <Mail className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Draft Outreach</div>
                                    <div className="text-xs text-slate-400">Personalized email draft</div>
                                </button>
                                <button 
                                    onClick={() => onAgentAction('cultivation_courier', `Suggest 3 'Surprise & Delight' cultivation ideas for ${selectedEntity.name} based on their interests in ${safeTags.join(', ')}.`)}
                                    className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                        VIP SERVICE
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            <Gift className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Surprise & Delight</div>
                                    <div className="text-xs text-slate-400">Creative touchpoint ideas</div>
                                </button>
                            </>
                        )}

                        {/* Operations Actions */}
                        <button 
                            onClick={() => onAgentAction('advance', `Prepare a meeting briefing document for ${selectedEntity.name}. Include relationship history, suggested talking points, and strategic goals for the meeting.`)}
                            className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                OPERATIONS
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <Map className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                            </div>
                            <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Meeting Brief</div>
                            <div className="text-xs text-slate-400">Prepare for upcoming interaction</div>
                        </button>
                        
                        <button 
                            onClick={() => onAgentAction('ghostwriter', `Write a formal ${safeStatus === 'Solicitation' ? 'proposal' : 'update'} letter to ${selectedEntity.name}. Use the voice of the University President.`)}
                            className="p-4 bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all rounded-xl text-left group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg group-hover:bg-indigo-50 group-hover:text-indigo-600">
                                COMMS
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                                </div>
                            </div>
                            <div className="font-bold text-slate-700 mb-1 group-hover:text-indigo-700">Ghostwriter</div>
                            <div className="text-xs text-slate-400">Draft letters & comms</div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- LIST VIEW (Existing) ---
  return (
    <div className="flex-1 bg-slate-50 h-full flex flex-col overflow-hidden min-h-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              Prospect CRM
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide border border-indigo-200">Live Database</span>
            </h1>
            <p className="text-slate-500 mt-1">Centralized holding place for agent-sourced intelligence</p>
          </div>
          <div className="flex gap-3">
            <div className="text-right px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-400 font-semibold uppercase">Total Records</div>
                <div className="text-xl font-bold text-slate-700">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : safeData.length}
                </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {['All', 'Corporation', 'Foundation', 'Individual', 'Contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search profiles, tags, status..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content - List */}
      <div className="flex-1 overflow-y-auto p-8 pb-24">
        {isLoading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Loading CRM records...</p>
             </div>
        ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredData.map((entity) => (
            <div 
                key={entity.id} 
                onClick={() => onSelectEntity(entity)}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group"
            >
              <div className="p-5 flex items-start justify-between gap-4">
                {/* Left: Icon & Basic Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    entity.type === 'Corporation' ? 'bg-blue-50 text-blue-600' :
                    entity.type === 'Foundation' ? 'bg-purple-50 text-purple-600' :
                    entity.type === 'Individual' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {entity.type === 'Corporation' && <Building2 className="w-6 h-6" />}
                    {entity.type === 'Foundation' && <BookOpen className="w-6 h-6" />}
                    {entity.type === 'Individual' && <User className="w-6 h-6" />}
                    {entity.type === 'Contact' && <Users className="w-6 h-6" />}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {entity.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(entity.status)}`}>
                            {entity.status}
                        </span>
                    </div>
                    
                    {entity.role && (
                        <div className="text-sm text-slate-500 font-medium">
                            {entity.role} {entity.organization && <span className="text-slate-300 mx-1">|</span>} {entity.organization}
                        </div>
                    )}
                    {/* Safety check for tags: ensure it exists before joining */}
                    {!entity.role && (
                        <div className="text-sm text-slate-400 font-medium flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {entity.tags && Array.isArray(entity.tags) ? entity.tags.join(', ') : ''}
                        </div>
                    )}

                    <div className="mt-3 flex items-center gap-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                            Capacity: <span className="font-semibold text-slate-700">{entity.capacity || 'Unknown'}</span>
                        </div>
                         <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
                            Sourced by: <span className="font-medium text-indigo-600">{getAgentName(entity.sourceAgentId)}</span>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Right: Next Steps & Actions */}
                <div className="flex flex-col items-end gap-3">
                     <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Suggested Next Step</div>
                        <div className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded border border-slate-100 max-w-xs truncate">
                            {entity.nextStep}
                        </div>
                     </div>
                     <div className="flex items-center gap-2 mt-1">
                        <div className="text-xs text-slate-400">
                            Last Action: {entity.lastAction}
                        </div>
                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded hover:text-slate-600">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                     </div>
                </div>
              </div>
              
              {/* Footer Bar (Alignment Score) */}
              {entity.alignmentScore && (
                <div className="h-1 w-full bg-slate-100 rounded-b-xl overflow-hidden flex">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                        style={{width: `${entity.alignmentScore}%`}} 
                     />
                </div>
              )}
            </div>
          ))}
        </div>
        )}
        
        {/* Empty State if filter yields nothing */}
        {!isLoading && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p>No records found matching "{searchQuery}".</p>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs text-indigo-600 hover:underline"
                  >
                    Clear search
                  </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
