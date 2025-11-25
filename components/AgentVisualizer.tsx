
import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { AgentDefinition } from '../types';
import { CloudLightning, BarChart3, PieChart as PieIcon, CheckCircle2 } from 'lucide-react';

interface AgentVisualizerProps {
  activeAgent: AgentDefinition;
}

// Mock data for the visualizers
const kpiData = [
  { name: 'Q1', revenue: 4000, pipeline: 2400 },
  { name: 'Q2', revenue: 3000, pipeline: 1398 },
  { name: 'Q3', revenue: 2000, pipeline: 9800 },
  { name: 'Q4', revenue: 2780, pipeline: 3908 },
  { name: 'Q5', revenue: 1890, pipeline: 4800 },
  { name: 'Q6', revenue: 2390, pipeline: 3800 },
];

const loopData = [
  { name: 'Corporate Gift', value: 1000000, color: '#4f46e5' }, // Indigo 600
  { name: 'Training Cost', value: 400000, color: '#9333ea' }, // Purple 600
  { name: 'Hiring ROI', value: 2500000, color: '#10b981' }, // Emerald 500
  { name: 'Endowment Yield', value: 50000, color: '#f59e0b' }, // Amber 500
];

export const AgentVisualizer: React.FC<AgentVisualizerProps> = ({ activeAgent }) => {
  if (activeAgent.visualizationType === 'NONE') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white border-l border-slate-200 p-8 text-center min-h-0 overflow-hidden">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <activeAgent.icon className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-slate-900 font-semibold mb-2">Agent Active</h3>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          {activeAgent.name} is analyzing data and processing your request using Gemini 3 Pro reasoning.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-l border-slate-200 flex flex-col min-h-0 overflow-hidden">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-lg px-6">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${activeAgent.visualizationType === 'KPI' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}>
             <BarChart3 className="w-4 h-4" />
             KPI Mode
          </span>
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${activeAgent.visualizationType === 'LOOP' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100'}`}>
             <PieIcon className="w-4 h-4" />
             Loop Mode
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
           <CheckCircle2 className="w-4 h-4 text-emerald" />
           <span>Synced</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background-light/50 pb-20">
        {activeAgent.visualizationType === 'KPI' && (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-text-dark mb-1">Revenue Forecast</h3>
              <p className="text-sm text-slate-500 mb-6">Predicted pipeline revenue vs Actuals</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kpiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 11}} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 11}} stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="pipeline" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-text-dark mb-1">Donor Retention Metrics</h3>
              <p className="text-sm text-slate-500 mb-6">YTD Retention by Cohort</p>
              <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={kpiData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 11}} stroke="#94a3b8" axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                      <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                  </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeAgent.visualizationType === 'LOOP' && (
          <>
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-emerald/10 rounded-full flex items-center justify-center mb-3">
                    <span className="text-emerald font-bold text-lg">12x</span>
                </div>
                <h3 className="text-text-dark font-bold text-lg">Projected ROI</h3>
                <p className="text-sm text-slate-500 mt-1">Based on 5-year Cohort Model</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-semibold text-text-dark mb-6">Flywheel Components</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={loopData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {loopData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '20px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-dark-nav to-slate-900 p-5 rounded-xl shadow-lg text-white">
                <div className="flex items-center gap-2 mb-4">
                    <CloudLightning className="w-4 h-4 text-amber" />
                    <h4 className="text-sm font-bold tracking-wide">LOOP STRATEGY</h4>
                </div>
                <ul className="space-y-3 text-xs leading-relaxed opacity-90">
                    <li className="flex gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald/20 text-emerald font-bold text-[10px]">1</span> 
                        <span>Secure $1M Corporate Gift for training facility.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald/20 text-emerald font-bold text-[10px]">2</span> 
                        <span>Train 50-student cohort annually.</span>
                    </li>
                    <li className="flex gap-3">
                         <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald/20 text-emerald font-bold text-[10px]">3</span> 
                        <span>Partner hires 80% (saving $40k/hire).</span>
                    </li>
                </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
