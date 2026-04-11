import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  Briefcase, Gavel, Clock, TrendingUp, Calendar, 
  Plus, X, CheckCircle, Bell, ChevronRight, Scale, Download,
  Sparkles, Search, MapPin, MousePointer2, ExternalLink, FileText
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

  const handleDownloadNotice = (notice: LegalNotice) => {
    const doc = new jsPDF();
    const margin = 14;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const lineH = 4;
    let y = 28;

    const addBlockLabel = (label: string) => {
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.25);
      doc.line(margin, y, pageW - margin, y);
      y += 3.5;
      doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(100, 116, 139).text(label.toUpperCase(), margin, y);
      y += 5;
    };

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold').setFontSize(7).setTextColor(71, 85, 105).text(`${label}:`, margin, y);
      const lines = doc.splitTextToSize(value || '—', pageW - margin - 48);
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(15, 23, 42).text(lines, margin, y + lineH);
      y += lineH + lines.length * lineH + 3;
    };

    doc.setFillColor(30, 41, 59).rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255).setFont('helvetica', 'bold').setFontSize(14).text('LEGAL NOTICE', margin, 12);
    doc.setFontSize(8).setFont('helvetica', 'normal').setTextColor(251, 191, 36).text(`#${notice.noticeNumber}`, margin, 18);
    
    addBlockLabel('Issued by');
    addField('Authority', `${notice.issuerRole} — ${notice.issuerName}`);
    addBlockLabel('Subject');
    addField('Subject', notice.subject);
    doc.save(`Legal-Notice-${notice.noticeNumber}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-[10px]">Accessing Bar Records...</p>
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
              <Briefcase size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Lawyer Chambers</h1>
              <p className="text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em]">Adv. {user?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
               <Notifications />
            </div>
            <button 
              onClick={() => setIsScheduleOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Calendar size={16} />
              Schedule Hearing
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-10 pb-24">
        
        {/* 2. ANALYTICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform"><Briefcase size={24} /></div>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase">Active</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{activeCases.length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Assigned Files</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform"><Gavel size={24} /></div>
              <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase">Hearings</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{upcomingHearings.length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Upcoming Dates</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform"><Clock size={24} /></div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase">Billable</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">12.5</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Hours Tracked</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl shadow-slate-200 flex flex-col justify-between text-white group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><TrendingUp size={120} /></div>
            <div className="z-10 flex justify-between items-start">
              <div className="p-3 bg-white/10 rounded-2xl"><TrendingUp size={24} /></div>
              <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-1 rounded-full uppercase">Top 5%</span>
            </div>
            <div className="z-10">
              <h3 className="text-3xl font-black tracking-tighter">92%</h3>
              <p className="text-white/50 text-[10px] font-black uppercase mt-1 tracking-[0.2em]">Overall Success</p>
            </div>
          </div>
        </div>

        {/* 3. TABS INTERFACE */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            {[
              { id: 'cases', label: 'Case Management', icon: Briefcase },
              { id: 'research', label: 'AI Deep Research', icon: Sparkles },
              { id: 'marketplace', label: 'Case Marketplace', icon: TrendingUp }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-6 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 lg:p-10">
            {activeTab === 'cases' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="lg:col-span-1 space-y-8">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><Calendar size={16} /> Calendar</h3>
                  <div className="space-y-4">
                    {upcomingHearings.length === 0 ? (
                      <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No court dates</p>
                      </div>
                    ) : (
                      upcomingHearings.map((h, i) => (
                        <div key={i} className="group p-5 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-orange-200 transition-all">
                          <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                              <span className="text-lg font-black leading-none">{new Date(h.date).getDate()}</span>
                              <span className="text-[8px] font-black uppercase tracking-tighter">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                            </div>
                            <div>
                              <h4 className="font-black text-slate-900 text-sm">{h.title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{h.location}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2"><FileText size={16} /> Active Files</h3>
                  <div className="space-y-4">
                    {activeCases.map(c => {
                      const notices = getMatchingNotices(c);
                      return (
                        <div key={c._id} className={`p-6 rounded-[32px] border-2 transition-all group ${notices.length > 0 ? 'bg-amber-50 border-amber-200 shadow-amber-100' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl'}`}>
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${c.status === 'pending_lawyer' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.status.replace('_', ' ')}</span>
                                {c.isProBono && <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-pink-100 text-pink-700">Pro Bono</span>}
                              </div>
                              <h4 className="text-lg font-black text-slate-900 tracking-tight">{c.title}</h4>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">#{c.caseNumber} • {c.location}</p>
                            </div>
                            <button onClick={() => navigate(`/case/${c._id}`)} className="p-3 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all"><ChevronRight size={20} /></button>
                          </div>
                          {notices.length > 0 && (
                            <div className="p-4 bg-white/60 rounded-2xl border border-amber-200 space-y-2">
                              {notices.map(n => (
                                <div key={n._id} onClick={() => setSelectedNotice(n)} className="flex items-center justify-between text-[10px] font-black text-amber-700 uppercase cursor-pointer hover:underline">
                                  <span className="flex items-center gap-2"><Bell size={12}/> Legal Notice Received</span>
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
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={200} /></div>
                  <div className="relative z-10 max-w-2xl">
                    <h3 className="text-3xl font-black tracking-tight mb-4">Deep Research AI</h3>
                    <p className="text-white/60 text-sm font-medium mb-8">Access 50+ years of precedents, BNS sections, and BNSS guidelines instantly with Gemini 3 Flash.</p>
                    <form onSubmit={handleResearch} className="flex gap-3">
                      <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search case laws or BNS sections..."
                          className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl focus:bg-white focus:text-slate-900 transition-all outline-none font-bold text-sm"
                        />
                      </div>
                      <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all">Search</button>
                    </form>
                  </div>
                </div>

                {researchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {researchResults.map((res, i) => (
                      <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-emerald-100">{res.relevance} Match</span>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.citation}</p>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{res.title}</h4>
                        <p className="text-slate-600 text-xs font-medium leading-relaxed mb-6">{res.summary}</p>
                        <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"><ExternalLink size={14}/> Full Judgment</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Public Requests</h3>
                  <div className="px-4 py-2 bg-indigo-50 rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">{unassignedCases.length} Opportunities</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {unassignedCases.map(c => (
                    <div key={c._id} className="bg-white p-8 rounded-[32px] border border-slate-100 hover:border-indigo-300 hover:shadow-2xl transition-all group">
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${c.isProBono ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{c.isProBono ? 'Pro Bono Aid' : 'Private Request'}</span>
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><MousePointer2 size={16} /></div>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-4 tracking-tight">{c.title}</h4>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><MapPin size={12}/> {c.location}</div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><Calendar size={12}/> {new Date(c.createdAt).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => handleAcquireCase(c._id)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">Send Representation Proposal</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LEGAL NOTICE MODAL (Premium Stylized) */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 md:p-10 animate-in fade-in duration-300" onClick={() => setSelectedNotice(null)}>
          <div className="bg-white rounded-[40px] shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-xl"><Scale size={28} /></div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">Legal Notice</h2>
                  <p className="text-amber-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">#{selectedNotice.noticeNumber}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownloadNotice(selectedNotice)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Download size={20}/></button>
                <button onClick={() => setSelectedNotice(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-red-500 transition-all"><X size={20}/></button>
              </div>
            </div>
            <div className="p-10 overflow-y-auto bg-[#F8FAFC] space-y-10">
              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Official Statement</h4>
                <p className="text-lg font-black text-slate-900 leading-tight mb-6">{selectedNotice.subject}</p>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap">{selectedNotice.description}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tight">Set Court Date</h3>
              <button onClick={() => setIsScheduleOpen(false)} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"><X size={20}/></button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Case Reference</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm appearance-none cursor-pointer" onChange={e => setHearingForm({...hearingForm, caseId: e.target.value})} required>
                  <option value="">Select a file...</option>
                  {activeCases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                <input type="text" placeholder="e.g. Preliminary Review" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" onChange={e => setHearingForm({...hearingForm, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                  <input type="datetime-local" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xs" onChange={e => setHearingForm({...hearingForm, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room</label>
                  <input type="text" placeholder="Court 04" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" onChange={e => setHearingForm({...hearingForm, location: e.target.value})} required />
                </div>
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Broadcast Schedule</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};