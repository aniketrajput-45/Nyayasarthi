import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Gavel, AlertCircle, CheckCircle, Clock, 
  ArrowRight, Shield, Briefcase, FileText, Lock,
  TrendingUp, Calendar, ChevronRight, Activity, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssignModal } from '../AssignModal'; 
import { Notifications } from '../Notifications';

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
    } catch (error) { console.error("Error loading judge data", error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [token]);

  const getHeatmapColor = (days: number) => {
    if (days < 0) return 'bg-red-500 shadow-red-100';
    if (days < 15) return 'bg-orange-400 shadow-orange-100';
    return 'bg-emerald-400 shadow-emerald-100';
  };

  const handleCloseCase = async (id: string, caseNumber: string) => {
    if (!confirm(`ISSUE VERDICT for Case #${caseNumber}?`)) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/verdict`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) { alert(`Case Resolved.`); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return { color: 'text-slate-400', text: 'NO DEADLINE', icon: Clock };
    const today = new Date();
    const due = new Date(deadline);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); 
    if (diff < 0) return { color: 'bg-red-50 text-red-600 border-red-100', text: `${Math.abs(diff)}D OVERDUE`, icon: AlertCircle };
    if (diff < 15) return { color: 'bg-orange-50 text-orange-600 border-orange-100', text: `${diff}D LEFT`, icon: Clock };
    return { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: `${diff}D REMAINING`, icon: CheckCircle };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-[10px]">Opening Court Records...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* 1. PREMIUM HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200 shrink-0">
              <Gavel size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">High Court Chambers</h1>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Hon'ble Judge {user?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer relative group">
               <Notifications />
            </div>
            <div className="px-4 py-2.5 bg-slate-900 text-white rounded-xl flex items-center gap-2 shadow-xl shadow-slate-200">
              <Lock size={16} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secure Session</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-10 pb-24">
        
        {/* 2. JUDICIAL ANALYTICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-slate-900 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-full uppercase">Active</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{assignedCases.length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Ongoing Trials</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-red-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:scale-110 transition-transform"><AlertCircle size={24} /></div>
              <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase">Urgent</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{unassignedCases.length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Awaiting Police</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={24} /></div>
              <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase">Alert</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.backlog}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Statutory Backlog</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl shadow-slate-200 flex flex-col justify-between text-white group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Award size={120} /></div>
            <div className="z-10 flex justify-between items-start">
              <div className="p-3 bg-white/10 rounded-2xl"><Activity size={24} /></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mt-2"></div>
            </div>
            <div className="z-10">
              <h3 className="text-2xl font-black tracking-tight tracking-widest uppercase">88%</h3>
              <p className="text-white/50 text-[10px] font-black uppercase mt-1 tracking-[0.2em]">Disposal Rate</p>
            </div>
          </div>
        </div>

        {/* 3. TABS: DOCKET & ANALYTICS */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button onClick={() => setActiveTab('docket')} className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'docket' ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}><Briefcase size={18} /> Judicial Docket</button>
            <button onClick={() => setActiveTab('analytics')} className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'analytics' ? 'text-slate-900 bg-slate-50' : 'text-slate-400 hover:text-slate-600'}`}><TrendingUp size={18} /> Pendency Analytics</button>
          </div>

          <div className="p-8 lg:p-10">
            {activeTab === 'docket' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* UNASSIGNED CASES */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><div className="w-1.5 h-6 bg-red-500 rounded-full"></div> Action Required</h3>
                    <span className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100 uppercase">{unassignedCases.length} Critical Assignments</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unassignedCases.map(c => {
                      const timer = getTimerStatus(c.deadlineDate);
                      return (
                        <div key={c._id} className="p-6 bg-slate-50 rounded-[32px] border border-transparent hover:bg-white hover:border-red-200 hover:shadow-xl hover:shadow-red-50 transition-all duration-500 group">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-black text-slate-900 group-hover:text-red-600 transition-colors uppercase tracking-tight">{c.title}</h4>
                              <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">#{c.caseNumber}</p>
                            </div>
                            {timer && <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${timer.color}`}>{timer.text}</span>}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => navigate(`/case/${c._id}`)} className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all">Review File</button>
                            <button onClick={() => { setSelectedCase(c); setAssignModalOpen(true); }} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-slate-200">Assign Police</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVE DOCKET */}
                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2"><div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div> Ongoing Proceedings</h3>
                  <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-50">
                        <tr>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Profile</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Timer</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Court Team</th>
                          <th className="px-8 py-6 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {assignedCases.map(c => {
                          const timer = getTimerStatus(c.deadlineDate);
                          return (
                            <tr key={c._id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="px-8 py-6">
                                <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{c.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">#{c.caseNumber}</p>
                              </td>
                              <td className="px-8 py-6">
                                {timer && <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${timer.color}`}>{timer.text}</span>}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col gap-1">
                                  {c.assignedLawyer && <p className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1.5"><Briefcase size={12} className="text-slate-400"/> Adv. {c.assignedLawyer.fullName.split(' ')[0]}</p>}
                                  {c.assignedPolice && <p className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1.5"><Shield size={12} className="text-blue-500"/> Off. {c.assignedPolice.fullName.split(' ')[0]}</p>}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => navigate(`/case/${c._id}`)} className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"><ChevronRight size={20} /></button>
                                  <button onClick={() => handleCloseCase(c._id, c.caseNumber)} className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all" title="Issue Final Verdict"><Lock size={20} /></button>
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
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><TrendingUp size={200} /></div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-black tracking-tight mb-2">Live Pendency Heatmap</h3>
                    <p className="text-white/60 text-sm font-medium mb-10 max-w-lg">Real-time visualization of court backlog and statutory deadline distribution under BNSS guidelines.</p>
                    
                    <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-15 gap-3">
                      {assignedCases.concat(unassignedCases).map((c, i) => {
                        const today = new Date();
                        const due = new Date(c.deadlineDate);
                        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div key={i} onClick={() => navigate(`/case/${c._id}`)} className={`aspect-square rounded-xl transition-all transform hover:scale-125 cursor-pointer shadow-2xl ${getHeatmapColor(diff)}`} title={`${c.title}`}></div>
                        );
                      })}
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div key={`f-${i}`} className="aspect-square rounded-xl bg-white/5 border border-white/5 border-dashed"></div>
                      ))}
                    </div>

                    <div className="mt-12 flex gap-6 text-[10px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Overdue</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400"></div> Critical</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-400"></div> Healthy</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                    <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3"><Shield size={20} className="text-indigo-600"/> Security Audit</h4>
                    <div className="space-y-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="p-4 bg-slate-50 rounded-[24px] border border-slate-100 flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-tight">Case Digital File Access: Officer {i}</p>
                          <span className="text-[9px] font-bold text-slate-400">{i}h ago</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5"><Lock size={120} /></div>
                    <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3"><Award size={20} className="text-slate-900"/> Verdict Signing</h4>
                    <div className="p-10 text-center border-4 border-dashed border-slate-50 rounded-[32px]">
                      <Lock size={32} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Connect Aadhaar eSign or Hardware Token to enable digital authentication.</p>
                      <button className="mt-6 px-8 py-3 bg-slate-900 text-white text-[10px] font-black rounded-2xl hover:bg-indigo-600 transition-all uppercase tracking-widest shadow-xl shadow-slate-200">Initialize eSign</button>
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