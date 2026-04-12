import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  Briefcase, Gavel, Clock, TrendingUp, Calendar, 
  Plus, X, CheckCircle, Bell, ChevronRight, Scale, Download,
  Sparkles, Search, MapPin, MousePointer2, ExternalLink, FileText, Globe, ArrowUpRight,
  Sun, Moon, Eye, Award
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
}

interface LegalNotice {
  _id: string;
  noticeNumber: string;
  caseNumber?: string;
  subject: string;
  description: string;
  issuerRole: string;
  issuerName: string;
  noticeType?: string;
  urgency?: string;
  noticeDate?: string;
  incidentTitle?: string;
  caseType?: string;
  location?: string;
  dateOfIncident?: string;
  issuedBy?: { fullName?: string; email?: string; role?: string };
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
  const [unassignedCases, setUnassignedCases] = useState<Case[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<LegalNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cases' | 'research' | 'marketplace'>('cases');

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [hearingForm, setHearingForm] = useState({ caseId: '', title: '', date: '', location: '' });

  const getID = (entity: any) => {
    if (!entity) return null;
    return typeof entity === 'string' ? entity : entity._id; 
  };

  const normalizeCaseNumber = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, ' ');
  
  const getMatchingNotices = (caseItem: Case): LegalNotice[] => {
    const caseNum = normalizeCaseNumber(caseItem.caseNumber || '');
    if (!caseNum) return [];
    return legalNotices.filter(notice => normalizeCaseNumber(notice.caseNumber || '') === caseNum);
  };

  useEffect(() => {
    const apiUrl = getApiUrl();
    const fetchData = async () => {
      try {
        const res = await fetch(`${apiUrl}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const allCases: Case[] = await res.json();
          const myId = user?.userId || user?._id;

          const myCases = allCases.filter(c => getID(c.assignedLawyer) === myId && c.status !== 'resolved');
          setActiveCases(myCases);
          setUnassignedCases(allCases.filter(c => !c.assignedLawyer));

          const hearings: Hearing[] = [];
          myCases.forEach(c => {
            if (c.hearings) {
              c.hearings.forEach((h: any) => {
                hearings.push({ ...h, caseId: c._id, caseTitle: c.title, date: h.date });
              });
            }
          });
          setUpcomingHearings(hearings.filter(h => new Date(h.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5));
        }

        const noticesRes = await fetch(`${apiUrl}/legal-notice/lawyer/for-assigned-cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setLegalNotices((Array.isArray(noticesData) ? noticesData : []).filter((n: LegalNotice) => n.issuerRole === 'judge'));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  const handleResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      setResearchResults([
        { title: "State of Maharashtra vs. Sandeep (2024)", citation: "2024 INSC 412", relevance: "98%", summary: "Clarified the application of BNS Section 304 regarding negligence." },
        { title: "K. Murugan vs. Union of India (2023)", citation: "2023 SCC OnLine SC 156", relevance: "85%", summary: "Established guidelines for digital evidence admissibility under BNSS." },
        { title: "Cyber Fraud Collective vs. RBI (2025)", citation: "2025 DEL HC 89", relevance: "72%", summary: "Liability of intermediaries in financial hacking cases." }
      ]);
      setIsSearching(false);
    }, 1500);
  };

  const handleAcquireCase = async (caseId: string) => {
    if(!confirm("Are you sure you want to represent this client?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/cases/${caseId}/assign-lawyer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lawyerId: user?.userId || user?._id })
      });
      if(res.ok) {
        alert("Case acquired!");
        window.location.reload();
      }
    } catch (err) { console.error(err); }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getApiUrl()}/cases/${hearingForm.caseId}/hearings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(hearingForm)
      });
      if(res.ok) {
        alert("Hearing scheduled and broadcasted.");
        setIsScheduleOpen(false);
        window.location.reload();
      }
    } catch (err) { console.error(err); }
  };

  const handleDownloadNotice = (notice: LegalNotice) => {
    const doc = new jsPDF();
    doc.setFontSize(14).text('LEGAL NOTICE', 14, 20);
    doc.setFontSize(10).text(`Number: ${notice.noticeNumber}`, 14, 30);
    doc.text(`Authority: ${notice.issuerName}`, 14, 40);
    doc.text(`Subject: ${notice.subject}`, 14, 50);
    doc.save(`Notice-${notice.noticeNumber}.pdf`);
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
      
      {/* 1. HEADER */}
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
               <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Adv. {user?.fullName}</span>
            </div>
            <div className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
               <Notifications />
            </div>
            <button 
              onClick={() => setIsScheduleOpen(true)}
              className={`px-6 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border transition-all ${
                theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_0_30px_rgba(79,70,229,0.2)] border-indigo-500/50'
              }`}
            >
              Set Hearing
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        
        {/* 2. STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: 'Active Files', val: activeCases.length, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'Court Dates', val: upcomingHearings.length, icon: Gavel, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Billable Nodes', val: '12.5h', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Market Standing', val: 'Top 5%', icon: Award, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-600 to-indigo-800', border: 'border-white/10', isAward: true }
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
                {stat.isAward ? <TrendingUp size={24}/> : <stat.icon size={24} />}
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
            {['cases', 'research', 'marketplace'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-8 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${activeTab === tab ? (theme === 'light' ? 'text-indigo-600 bg-slate-50' : 'text-indigo-400 bg-white/5') : 'text-slate-500 hover:text-slate-300'}`}>
                {tab === 'cases' && <Briefcase size={18} />}
                {tab === 'research' && <Sparkles size={18} />}
                {tab === 'marketplace' && <TrendingUp size={18} />}
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
                      <div key={i} className={`p-6 border rounded-3xl group transition-all ${
                        theme === 'light' ? 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-xl' : 'bg-white/5 border-white/5 hover:border-orange-500/30'
                      }`}>
                        <div className="flex gap-5 items-center">
                          <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex flex-col items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500">
                            <span className="text-xl font-black">{new Date(h.date).getDate()}</span>
                            <span className="text-[8px] font-black uppercase">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div>
                            <h4 className={`text-sm font-black uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{h.title}</h4>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{h.location}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-10">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-3 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}><FileText size={16} /> Active Files</h3>
                  <div className="space-y-6">
                    {activeCases.map(c => {
                      const notices = getMatchingNotices(c);
                      return (
                        <div key={c._id} className={`p-8 rounded-[2.5rem] border transition-all group ${
                          notices.length > 0 ? 'bg-orange-500/5 border-orange-500/20' : 
                          (theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-300' : 'bg-white/5 border-white/5 hover:border-indigo-500/30')
                        }`}>
                          <div className="flex justify-between items-start mb-8">
                            <div>
                              <div className="flex items-center gap-3 mb-3">
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${c.status === 'pending_lawyer' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{c.status.replace('_', ' ')}</span>
                                {c.isProBono && <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400">Pro Bono</span>}
                              </div>
                              <h4 className={`text-2xl font-black tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-400'}`}>{c.title}</h4>
                              <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Node: {c.caseNumber} • {c.location}</p>
                            </div>
                            <button onClick={() => navigate(`/case/${c._id}`)} className={`p-4 rounded-2xl transition-all ${
                              theme === 'light' ? 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white' : 'bg-white/5 text-slate-400 hover:bg-white hover:text-slate-950'
                            }`}><ChevronRight size={20} /></button>
                          </div>
                          {notices.length > 0 && (
                            <div className={`p-5 rounded-2xl border space-y-3 ${theme === 'light' ? 'bg-orange-50 border-orange-100' : 'bg-white/5 border-orange-500/20'}`}>
                              {notices.map(n => (
                                <div key={n._id} onClick={() => setSelectedNotice(n)} className="flex items-center justify-between text-[9px] font-black text-orange-400 uppercase cursor-pointer hover:underline tracking-widest">
                                  <span className="flex items-center gap-3"><Bell size={12}/> Judicial Signal Received</span>
                                  <ChevronRight size={12}/>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'research' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={`p-12 rounded-[3rem] relative overflow-hidden border transition-all duration-500 ${
                  theme === 'light' ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-950 text-white border-white/5'
                }`}>
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Sparkles size={250} /></div>
                  <div className="relative z-10 max-w-2xl">
                    <h3 className="text-4xl font-black tracking-tighter uppercase mb-4">Deep Research AI</h3>
                    <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed uppercase tracking-widest">Query 50+ years of precedents via the Gemini Neural Engine.</p>
                    <form onSubmit={handleResearch} className="flex gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Enter legal query or BNS node..." className="w-full pl-14 pr-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-sm uppercase tracking-wider" />
                      </div>
                      <button className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-2xl shadow-white/10">Execute</button>
                    </form>
                  </div>
                </div>

                {researchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {researchResults.map((res, i) => (
                      <div key={i} className={`p-10 rounded-[3rem] border transition-all group ${
                        theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-indigo-300' : 'bg-white/5 border-white/5 hover:border-indigo-500/30'
                      }`}>
                        <div className="flex justify-between items-start mb-6">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-emerald-500/20">{res.relevance} Relevance</span>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{res.citation}</p>
                        </div>
                        <h4 className={`text-xl font-black mb-4 uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-400'}`}>{res.title}</h4>
                        <p className={`text-xs font-medium leading-relaxed mb-8 ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{res.summary}</p>
                        <button className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] hover:underline"><ExternalLink size={16}/> Access Full Judgment</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center">
                  <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Public Representation Requests</h3>
                  <div className={`px-5 py-2 border rounded-2xl text-[9px] font-black uppercase tracking-widest ${
                    theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  }`}>{unassignedCases.length} Opportunities</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {unassignedCases.map(c => (
                    <div key={c._id} className={`p-10 rounded-[3rem] border transition-all group ${
                      theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300' : 'bg-white/5 border-white/5 hover:border-white/20 hover:shadow-2xl'
                    }`}>
                      <div className="flex justify-between items-start mb-8">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${c.isProBono ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/5 text-slate-400 border border-white/10'}`}>{c.isProBono ? 'Pro Bono Aid' : 'Civil Litigation'}</span>
                        <div className={`p-3 rounded-2xl transition-all ${
                          theme === 'light' ? 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-white/5 group-hover:bg-indigo-600 group-hover:text-white'
                        }`}><MousePointer2 size={20} /></div>
                      </div>
                      <h4 className={`text-2xl font-black mb-6 uppercase tracking-tight line-clamp-1 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.title}</h4>
                      <div className="flex items-center gap-6 mb-10">
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"><MapPin size={14}/> {c.location}</div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest"><Calendar size={14}/> {new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => handleAcquireCase(c._id)} className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/5 border ${
                        theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-500' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white border-white/10'
                      }`}>Submit Representation Proposal</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in duration-500">
          <div className={`w-full max-w-md shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-700 overflow-hidden border ${
            theme === 'light' ? 'bg-white border-slate-200 rounded-[3rem]' : 'bg-white rounded-[3rem] border-white/10'
          }`}>
            <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10"><Calendar size={150} /></div>
              <h3 className="text-2xl font-black tracking-tighter uppercase relative z-10">Sync Court Date</h3>
              <button onClick={() => setIsScheduleOpen(false)} className="p-3 bg-white/5 rounded-2xl hover:bg-red-600 transition-all relative z-10"><X size={24}/></button>
            </div>
            <form onSubmit={handleScheduleSubmit} className={`p-10 space-y-8 ${theme === 'light' ? 'bg-white' : 'bg-slate-50'}`}>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">File Reference</label>
                <select className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-xs uppercase tracking-wider cursor-pointer appearance-none" onChange={e => setHearingForm({...hearingForm, caseId: e.target.value})} required>
                  <option value="">Select investigation...</option>
                  {activeCases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Objective</label>
                <input type="text" placeholder="e.g. EVIDENCE REVIEW" className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-xs uppercase tracking-widest" onChange={e => setHearingForm({...hearingForm, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Timestamp</label>
                  <input type="datetime-local" className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-[10px]" onChange={e => setHearingForm({...hearingForm, date: e.target.value})} required />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Chamber</label>
                  <input type="text" placeholder="ROOM 04" className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-xs uppercase tracking-widest" onChange={e => setHearingForm({...hearingForm, location: e.target.value})} required />
                </div>
              </div>
              <button className="w-full py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200">Broadcast Node</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};