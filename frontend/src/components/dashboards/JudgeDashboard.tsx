import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { 
  Gavel, AlertCircle, CheckCircle, Clock, 
  ArrowRight, Shield, Briefcase, FileText, Lock,
  TrendingUp, Calendar, ChevronRight, Activity, Award, Globe, X,
  Sun, Moon, Eye, MessageSquare, User as UserIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssignModal } from '../AssignModal'; 
import { Notifications } from '../Notifications';
import { ProfileModel } from '../ProfileModel'; 

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  status: string;
  type: string;
  deadlineDate: string;
  assignedLawyer?: { _id: string; fullName: string; };
  assignedPolice?: { _id: string; fullName: string; };
}

export const JudgeDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ total: 0, pending: 0, unassigned: 0, backlog: 0 });
  const [unassignedCases, setUnassignedCases] = useState<Case[]>([]);
  const [assignedCases, setAssignedCases] = useState<Case[]>([]);    
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'docket' | 'analytics'>('docket');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const allCases: Case[] = await res.json();
        const pending = allCases.filter(c => !c.assignedPolice && c.status !== 'resolved');
        const active = allCases.filter(c => c.assignedPolice && c.status !== 'resolved');
        const today = new Date();
        const backlog = active.filter(c => new Date(c.deadlineDate) < today);

        setStats({ total: allCases.length, pending: active.length, unassigned: pending.length, backlog: backlog.length });
        setUnassignedCases(pending);
        setAssignedCases(active);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const getHeatmapColor = (days: number) => {
    if (days < 0) return 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]';
    if (days < 15) return 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]';
    return 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]';
  };

  const handleCloseCase = async (id: string, caseNumber: string) => {
    if (!confirm(`ISSUE FINAL VERDICT for Case #${caseNumber}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/verdict`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) { fetchData(); }
    } catch (err) { console.error(err); }
  };

  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)); 
    if (diff < 0) return { color: 'text-red-500 border-red-500/20 bg-red-500/5', text: `${Math.abs(diff)}D OVERDUE`, icon: AlertCircle };
    if (diff < 15) return { color: 'text-orange-500 border-orange-500/20 bg-orange-500/5', text: `${diff}D LEFT`, icon: Clock };
    return { color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5', text: `${diff}D REMAINING`, icon: CheckCircle };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14] dark:bg-[#070b14] light:bg-slate-50 high-contrast:bg-black transition-colors duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(255,255,255,0.1)]"></div>
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Opening Judicial Vault...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-slate-500/30 overflow-x-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      {/* 1. HEADER */}
      <nav className={`sticky top-0 z-[100] border-b px-6 lg:px-12 py-4 backdrop-blur-2xl transition-all duration-500 ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 
        theme === 'high-contrast' ? 'bg-black border-white' : 
        'bg-[#070b14]/80 border-white/5'
      }`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${
              theme === 'light' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900'
            }`}>
              <Gavel size={24} />
            </div>
            <div>
              <h1 className={`text-lg font-black leading-tight tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Nyayasarthi</h1>
              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.3em]">Judicial Chambers</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 
                theme === 'high-contrast' ? 'bg-zinc-900 border-white text-white hover:bg-zinc-800' : 
                'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
              title="Switch Accessibility Mode"
            >
              {theme === 'dark' && <Moon size={18} />}
              {theme === 'light' && <Sun size={18} />}
              {theme === 'high-contrast' && <Eye size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Mode</span>
            </button>

            <div className={`flex-1 md:flex-none flex items-center gap-2 backdrop-blur-md px-4 py-2.5 rounded-2xl border transition-all ${
              theme === 'light' ? 'bg-slate-100 border-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
              'bg-white/5 border-white/10'
            }`}>
               < Globe size={14} className="text-slate-500" />
               <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Hon'ble Judge: {user?.fullName}</span>
            </div>
            <div className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
               <Notifications />
            </div>
            <div className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${
              theme === 'light' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-950'
            }`}>
              <Lock size={14} className="text-orange-600" /> Secure Node
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        
        {/* 2. STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: 'Active Trials', val: assignedCases.length, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'Critical Assign', val: unassignedCases.length, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Statutory Backlog', val: stats.backlog, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Resolution Rate', val: '88%', icon: Award, color: 'text-white', bg: 'bg-gradient-to-br from-slate-700 to-slate-900', border: 'border-white/10' }
          ].map((stat, i) => (
            <div key={i} className={`p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm shadow-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
              `${stat.bg} ${stat.border}`
            } group`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${
                theme === 'light' ? 'bg-slate-50 border-slate-100 text-indigo-600' : 
                theme === 'high-contrast' ? 'bg-black border-white text-white' : 
                `${stat.bg} ${stat.color} ${stat.border}`
              }`}>
                <stat.icon size={24} />
              </div>
              <h3 className={`text-4xl font-black tracking-tighter mb-1 uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.val}</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 3. TABS */}
        <div className={`backdrop-blur-xl rounded-[3rem] border overflow-hidden shadow-2xl transition-all duration-500 ${
          theme === 'light' ? 'bg-white border-slate-200' : 
          theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
          'bg-white/5 border-white/10'
        }`}>
          <div className={`flex border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            {['docket', 'analytics'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-8 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${activeTab === tab ? (theme === 'light' ? 'text-indigo-600 bg-slate-50' : 'text-white bg-white/5') : 'text-slate-500 hover:text-slate-300'}`}>
                {tab === 'docket' ? <Briefcase size={18} /> : <TrendingUp size={18} />}
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="p-8 lg:p-12">
            {activeTab === 'docket' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* ACTION REQUIRED */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><div className="w-1 h-8 bg-red-500 rounded-full"></div> Critical Assignments</h3>
                    <span className="px-4 py-2 bg-red-500/10 text-red-500 text-[9px] font-black rounded-xl border border-red-500/20 uppercase tracking-widest">{unassignedCases.length} Pending Officer Matching</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {unassignedCases.map(c => {
                      const timer = getTimerStatus(c.deadlineDate);
                      return (
                        <div key={c._id} className={`p-8 rounded-[2.5rem] border transition-all group ${
                          theme === 'light' ? 'bg-white border-slate-200 hover:border-red-300 hover:shadow-xl' : 
                          theme === 'high-contrast' ? 'bg-black border-white hover:bg-zinc-900' : 
                          'bg-white/5 border-white/5 hover:border-red-500/30'
                        }`}>
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <h4 className={`text-lg font-black uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-red-600' : 'text-white group-hover:text-red-500'}`}>{c.title}</h4>
                              <p className="text-[10px] font-black text-slate-500 mt-2 uppercase tracking-widest">Reference Node: {c.caseNumber}</p>
                            </div>
                            {timer && <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${timer.color}`}>{timer.text}</span>}
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => navigate(`/case/${c._id}`)} className={`flex-1 py-4 border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}>Review Dossier</button>
                            <button onClick={() => { setSelectedCase(c); setAssignModalOpen(true); }} className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5 ${
                              theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-950 hover:bg-red-600 hover:text-white'
                            }`}>Assign Police</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ONGOING */}
                <div className="space-y-8 pt-8 border-t border-white/5">
                  <h3 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><div className="w-1 h-8 bg-indigo-500 rounded-full"></div> Ongoing Proceedings</h3>
                  <div className={`rounded-[3rem] border overflow-hidden transition-all duration-500 ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 
                    theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
                    'bg-white/5 border-white/5'
                  }`}>
                    <table className="w-full text-left">
                      <thead className={`${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'} border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                        <tr>
                          <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Judicial Profile</th>
                          <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Statutory Timer</th>
                          <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Court Team</th>
                          <th className="px-10 py-8 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                        {assignedCases.map(c => {
                          const timer = getTimerStatus(c.deadlineDate);
                          return (
                            <tr key={c._id} className={`transition-colors group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                              <td className="px-10 py-8">
                                <p className={`font-black text-sm uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.title}</p>
                                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Node ID: {c.caseNumber}</p>
                              </td>
                              <td className="px-10 py-8">
                                {timer && <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${timer.color}`}>{timer.text}</span>}
                              </td>
                              <td className="px-10 py-8">
                                <div className="flex flex-col gap-2">
                                  {c.assignedLawyer && <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><Briefcase size={12}/> Adv. {c.assignedLawyer.fullName.split(' ')[0]}</p>}
                                  {c.assignedPolice && <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-2"><Shield size={12} className="text-blue-500"/> Off. {c.assignedPolice.fullName.split(' ')[0]}</p>}
                                </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                <div className="flex justify-end gap-3">
                                  <button onClick={() => navigate(`/case/${c._id}`)} className={`p-4 rounded-2xl transition-all group-hover:shadow-2xl ${
                                    theme === 'light' ? 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white' : 'bg-white/5 text-slate-500 hover:bg-white hover:text-slate-950'
                                  }`}><ChevronRight size={20} /></button>
                                  <button onClick={() => handleCloseCase(c._id, c.caseNumber)} className="p-4 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all border border-emerald-500/20" title="Issue Final Verdict"><Lock size={20} /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={`p-12 rounded-[40px] relative overflow-hidden border shadow-2xl transition-all duration-500 ${
                  theme === 'light' ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-950 text-white border-white/5'
                }`}>
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><TrendingUp size={300} /></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">Statutory Pendency Matrix</h3>
                    <p className="text-slate-400 text-sm font-medium mb-12 max-w-lg leading-relaxed uppercase tracking-widest">Real-time neural map of court backlog and BNSS compliance nodes.</p>
                    
                    <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-4">
                      {assignedCases.concat(unassignedCases).map((c, i) => {
                        const today = new Date();
                        const due = new Date(c.deadlineDate);
                        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={i} onClick={() => navigate(`/case/${c._id}`)} className={`aspect-square rounded-2xl transition-all transform hover:scale-125 cursor-pointer shadow-2xl border border-white/10 ${getHeatmapColor(diff)}`} title={`${c.title}`}></div>
                        );
                      })}
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={`f-${i}`} className="aspect-square rounded-2xl bg-white/5 border border-white/5 border-dashed"></div>
                      ))}
                    </div>

                    <div className="mt-16 flex gap-10 text-[9px] font-black uppercase tracking-[0.3em]">
                      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-lg bg-red-500 shadow-lg shadow-red-500/40"></div> Breach</div>
                      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-lg bg-orange-500 shadow-lg shadow-orange-500/40"></div> Critical</div>
                      <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/40"></div> Optimized</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className={`p-10 rounded-[3rem] border shadow-sm transition-all duration-500 ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5 backdrop-blur-md'
                  }`}>
                    <h4 className={`font-black text-lg mb-8 uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Shield size={20} className="text-indigo-500"/> Node Integrity Audit</h4>
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className={`p-5 rounded-[2rem] border flex justify-between items-center transition-all duration-500 group ${
                          theme === 'light' ? 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:text-slate-950' : 'bg-white/5 border-white/5 hover:bg-white hover:text-slate-950'
                        }`}>
                          <p className="text-[9px] font-black uppercase tracking-widest">Cryptographic Access Trace: Node 0{i}</p>
                          <span className="text-[8px] font-black opacity-50 uppercase">{i}h 24m ago</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`p-10 rounded-[3rem] border shadow-sm relative overflow-hidden group transition-all duration-500 ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5 backdrop-blur-md'
                  }`}>
                    <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000"><Lock size={200} /></div>
                    <h4 className={`font-black text-lg mb-8 uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Award size={20} className="text-slate-500"/> Verdict Authentication</h4>
                    <div className={`p-12 text-center border-2 border-dashed rounded-[2.5rem] transition-all duration-500 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/10'
                    }`}>
                      <Lock size={40} className="mx-auto text-slate-700 mb-6" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">Connect eSign Node or Physical Authority Token to enable statutory authentication.</p>
                      <button className={`mt-8 px-10 py-4 rounded-2xl text-[10px] font-black transition-all uppercase tracking-[0.2em] shadow-2xl ${
                        theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'
                      }`}>Initialize Authority Sync</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AssignModal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} caseId={selectedCase?._id || ""} onAssign={() => { setAssignModalOpen(false); fetchData(); }} currentLawyer={selectedCase?.assignedLawyer?.fullName} />
    </div>
  );
};