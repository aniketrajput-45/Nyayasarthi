import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ProfileModel } from '../ProfileModel'; // <-- ADD THIS IMPORT

import { jsPDF } from 'jspdf';
import { 
  Briefcase, Gavel, Clock, TrendingUp, User as UserIcon, Calendar, 
  Plus, X, CheckCircle, Bell, ChevronRight, Scale, Download,
  Sparkles, Search, MapPin, MousePointer2, ExternalLink, FileText, Globe, ArrowUpRight,
  Sun, Moon, Eye, Award, Zap
} from 'lucide-react';
import { Notifications } from '../Notifications';

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  category: string;
  location: string;
  isProBono: boolean;
  assignedLawyer?: any; 
  createdAt: string;
  status: string;
  hearings?: any[];
  type: string;
  description: string;
}

interface Hearing {
  _id?: string;
  date: string;
  title: string;
  location: string;
  caseId: string;
  caseTitle: string;
}

export const LawyerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [marketplaceCases, setMarketplaceCases] = useState<Case[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cases' | 'research' | 'marketplace'>('cases');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [hearingForm, setHearingForm] = useState({ caseId: '', title: '', date: '', location: '' });

  const fetchData = async () => {
    try {
      const apiUrl = getApiUrl();
      
      // Fetch Active Cases (Assigned to me)
      const activeRes = await fetch(`${apiUrl}/cases?acceptedOnly=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveCases(data);
        
        // Extract Hearings
        const hearings: Hearing[] = [];
        data.forEach((c: Case) => {
          if (c.hearings) {
            c.hearings.forEach((h: any) => {
              hearings.push({ ...h, caseId: c._id, caseTitle: c.title, date: h.date });
            });
          }
        });
        setUpcomingHearings(hearings.filter(h => new Date(h.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5));
      }

      // Fetch Marketplace Cases (Filtered by Specialization)
      const marketRes = await fetch(`${apiUrl}/cases?marketplace=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (marketRes.ok) {
        setMarketplaceCases(await marketRes.json());
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleExpressInterest = async (caseId: string) => {
    try {
      const res = await fetch(`${getApiUrl()}/cases/${caseId}/interest`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Strategic Interest Logged. The citizen has been notified.");
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setResearchResults([
        { title: "State of Maharashtra vs. Sandeep (2024)", citation: "2024 INSC 412", relevance: "98%", summary: "Clarified the application of BNS Section 304 regarding negligence." },
        { title: "K. Murugan vs. Union of India (2023)", citation: "2023 SCC OnLine SC 156", relevance: "85%", summary: "Established guidelines for digital evidence admissibility under BNSS." }
      ]);
      setIsSearching(false);
    }, 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14] dark:bg-[#070b14] light:bg-slate-50 high-contrast:bg-black transition-colors duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(79,70,229,0.3)]"></div>
        <p className="text-indigo-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Accessing Bar Records...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-indigo-500/30 overflow-x-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      <nav className={`sticky top-0 z-[100] border-b px-6 lg:px-12 py-4 backdrop-blur-2xl transition-all duration-500 ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 
        theme === 'high-contrast' ? 'bg-black border-white' : 
        'bg-[#070b14]/80 border-white/5'
      }`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-white shadow-2xl transition-all duration-500 ${
              theme === 'light' ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-white/10'
            }`}>
              <Briefcase size={24} />
            </div>
            <div>
              <h1 className={`text-lg font-black leading-tight tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Nyayasarthi</h1>
              <p className="text-indigo-400 font-bold text-[9px] uppercase tracking-[0.3em]">Advocate Chambers</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white text-white hover:bg-zinc-800' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}>
              {theme === 'dark' && <Moon size={18} />}
              {theme === 'light' && <Sun size={18} />}
              {theme === 'high-contrast' && <Eye size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Mode</span>
            </button>
            <div 
              onClick={() => setIsProfileOpen(true)}
              className={`flex-1 md:flex-none flex items-center gap-2 backdrop-blur-md px-4 py-2.5 rounded-2xl border transition-all cursor-pointer hover:border-indigo-500/50 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 'bg-white/5 border-white/10'}`}>
               < Globe size={14} className="text-slate-500" />
               <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Adv. {user?.fullName}</span>
            </div>
            <div className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
               <Notifications />
            </div>
            <button onClick={() => setIsScheduleOpen(true)} className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border transition-all ${theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_0_30px_rgba(79,70,229,0.2)] border-indigo-500/50'}`}>Set Hearing</button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: 'Active Files', val: activeCases.length, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'Market Access', val: marketplaceCases.length, icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Court Dates', val: upcomingHearings.length, icon: Gavel, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Bar Status', val: 'Active', icon: Award, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-600 to-indigo-800', border: 'border-white/10' }
          ].map((stat, i) => (
            <div key={i} className={`p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm shadow-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : `${stat.bg} ${stat.border}`} group`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${theme === 'light' ? 'bg-slate-50 border-slate-100 text-indigo-600' : theme === 'high-contrast' ? 'bg-black border-white text-white' : `${stat.bg} ${stat.color} ${stat.border}`}`}><stat.icon size={24} /></div>
              <h3 className={`text-4xl font-black tracking-tighter mb-1 uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.val}</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className={`backdrop-blur-xl rounded-[3rem] border overflow-hidden shadow-2xl transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 'bg-white/5 border-white/10'}`}>
          <div className={`flex border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            {['cases', 'research', 'marketplace'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-8 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${activeTab === tab ? (theme === 'light' ? 'text-indigo-600 bg-slate-50' : 'text-indigo-400 bg-white/5') : 'text-slate-500 hover:text-slate-300'}`}>
                {tab === 'cases' && <Briefcase size={18} />}
                {tab === 'research' && <Sparkles size={18} />}
                {tab === 'marketplace' && <Zap size={18} />}
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="p-8 lg:p-12">
            {activeTab === 'cases' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="lg:col-span-1 space-y-10">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}><Calendar size={16} /> Calendar Nodes</h3>
                  <div className="space-y-4">
                    {upcomingHearings.map((h, i) => (
                      <div key={i} className={`p-6 border rounded-3xl group transition-all ${theme === 'light' ? 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-xl' : 'bg-white/5 border-white/5 hover:border-orange-500/30'}`}>
                        <div className="flex gap-5 items-center">
                          <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex flex-col items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                            <span className="text-xl font-black">{new Date(h.date).getDate()}</span>
                            <span className="text-[8px] font-black uppercase">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div><h4 className={`text-sm font-black uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{h.title}</h4><p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{h.location}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-10">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}><FileText size={16} /> Active Files</h3>
                  <div className="space-y-6">
                    {activeCases.map(c => (
                      <div key={c._id} className={`p-8 rounded-[2.5rem] border transition-all group ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-300' : 'bg-white/5 border-white/5 hover:border-indigo-500/30'}`}>
                        <div className="flex justify-between items-start mb-8">
                          <div>
                            <div className="flex items-center gap-3 mb-3"><span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500`}>{c.status.replace('_', ' ')}</span></div>
                            <h4 className={`text-2xl font-black tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-400'}`}>{c.title}</h4>
                            <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Node: {c.caseNumber} • {c.location}</p>
                          </div>
                          <button onClick={() => navigate(`/case/${c._id}`)} className={`p-4 rounded-2xl transition-all ${theme === 'light' ? 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white' : 'bg-white/5 text-slate-400 hover:bg-white hover:text-slate-950'}`}><ChevronRight size={20} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center">
                  <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Strategic Intake Marketplace</h3>
                  <div className={`px-5 py-2 border rounded-2xl text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'}`}>Filter: Matching Specialization</div>
                </div>
                {marketplaceCases.length === 0 ? (
                  <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <Sparkles size={48} className="mx-auto text-slate-700 mb-6 opacity-20" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No matching statutory nodes detected</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {marketplaceCases.map(c => (
                      <div key={c._id} className={`p-10 rounded-[3rem] border transition-all group ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-orange-300' : 'bg-white/5 border-white/5 hover:border-white/20 hover:shadow-2xl'}`}>
                        <div className="flex justify-between items-start mb-8">
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-400`}>{c.type} Case</span>
                          <div className={`p-3 rounded-2xl transition-all bg-white/5 text-slate-400`}><Zap size={20} /></div>
                        </div>
                        <h4 className={`text-2xl font-black mb-6 uppercase tracking-tight line-clamp-1 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.title}</h4>
                        <p className={`text-xs font-medium leading-relaxed mb-10 line-clamp-2 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>"{c.description}"</p>
                        
                        <div className="flex gap-3">
                          <button 
                            onClick={() => navigate(`/case/${c._id}`)}
                            className={`px-6 py-5 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] border transition-all ${
                              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            }`}
                          >
                            Review Case Dossier
                          </button>
                          <button 
                            onClick={() => handleExpressInterest(c._id)} 
                            className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl border ${
                              theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-500' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white border-white/10'
                            }`}
                          >
                            Express Strategic Interest
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileModel 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
      />
    </div>
  );
};