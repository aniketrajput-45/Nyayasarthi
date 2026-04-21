import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  AlertCircle, Calendar, CheckCircle, Clock, Gavel, 
  HelpCircle, RefreshCw, Shield, Ticket, User, X, Send,
  MessageSquare, Zap, Search, ArrowUpRight, Globe, Moon, Sun, Eye
} from 'lucide-react';

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

interface CaseItem {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  priority?: string;
  assignedLawyer?: string | { _id: string } | null;
  assignedPolice?: string | { _id: string } | null;
  assignedJudge?: string | { _id: string } | null;
  filedBy?: string | { _id: string } | null;
}

function getCaseUserId(f: string | { _id: string } | null | undefined): string | null {
  if (!f) return null;
  return typeof f === 'object' ? f._id : f;
}

interface ChatMessageItem {
  _id: string;
  message: string;
  senderId: { _id: string; fullName: string; email?: string };
  createdAt: string;
}

function getEnquiryRef(caseItem: CaseItem): string {
  return `ENQ-${caseItem.caseNumber.replace(/\s/g, '')}-${caseItem._id.slice(-6).toUpperCase()}`;
}

export const Chat: React.FC = () => {
  const { token, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [helpLookup, setHelpLookup] = useState({ caseNumber: '', date: '' });
  const [appliedFilter, setAppliedFilter] = useState<{ caseNumber: string; date: string } | null>(null);
  const [myCases, setMyCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<{
    _id: string;
    caseNumber: string;
    title: string;
    chatWithUserId: string;
    chatWithLabel: string;
  } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    setCasesLoading(true);
    const url = user?.role === 'lawyer'
      ? `${getApiUrl()}/cases?acceptedOnly=true`
      : `${getApiUrl()}/cases`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then(setMyCases)
      .catch(() => { setMyCases([]); setError('Failed to load cases'); })
      .finally(() => setCasesLoading(false));
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || !selectedCase?.chatWithUserId) {
      setChatMessages([]);
      return;
    }
    setChatLoading(true);
    setChatError('');
    fetch(`${getApiUrl()}/chat/case/${selectedCase._id}/thread/${selectedCase.chatWithUserId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.message || 'Failed to load messages');
        return data;
      })
      .then(setChatMessages)
      .catch((err) => {
        setChatMessages([]);
        setChatError(err instanceof Error ? err.message : 'Failed to load messages');
      })
      .finally(() => setChatLoading(false));
  }, [token, selectedCase?._id, selectedCase?.chatWithUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const fetchMessages = () => {
    if (!token || !selectedCase?.chatWithUserId) return;
    fetch(`${getApiUrl()}/chat/case/${selectedCase._id}/thread/${selectedCase.chatWithUserId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setChatMessages)
      .catch(() => {});
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedCase?.chatWithUserId || !token) return;
    setChatSending(true);
    setChatInput('');
    setChatError('');
    try {
      const res = await fetch(`${getApiUrl()}/chat/case/${selectedCase._id}/thread/${selectedCase.chatWithUserId}/message`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send');
      }
      const newMsg = await res.json();
      setChatMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to send message');
      setChatInput(text);
    } finally {
      setChatSending(false);
    }
  };

  const matchedCases = appliedFilter === null
    ? myCases
    : myCases.filter((c) => {
        const caseDate = new Date(c.createdAt).toISOString().slice(0, 10);
        const matchNumber = !appliedFilter.caseNumber.trim() ||
          c.caseNumber.toLowerCase().includes(appliedFilter.caseNumber.trim().toLowerCase());
        const matchDate = !appliedFilter.date || caseDate === appliedFilter.date;
        return matchNumber && matchDate;
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return 'bg-amber-500/15 text-amber-500 border-amber-500/20';
      case 'under-investigation': return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'in-court': return 'bg-orange-500/15 text-orange-400 border-orange-500/20';
      case 'resolved': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 p-6 lg:p-12 pb-32 space-y-12 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
        <div className="flex items-center gap-6">
          <div className={`p-4 rounded-2xl shadow-2xl transition-all ${
            theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-white/5 border border-white/10 text-indigo-400'
          }`}>
            <MessageSquare size={32} />
          </div>
          <div>
            <h2 className={`text-3xl font-black uppercase tracking-tighter transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Communication Hub</h2>
            <p className="text-indigo-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-1">Official Statutory Channel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-300'}`}>
            {theme === 'dark' && <Moon size={20} />}
            {theme === 'light' && <Sun size={20} />}
            {theme === 'high-contrast' && <Eye size={20} />}
          </button>
          <button
            onClick={() => { setAppliedFilter(null); setHelpLookup({ caseNumber: '', date: '' }); }}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white shadow-xl shadow-white/5'
            }`}
          >
            <RefreshCw size={16} /> Sync Registry
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-500 animate-in shake duration-500">
          <AlertCircle size={20} />
          <p className="text-xs font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      <div className="max-w-[1440px] mx-auto space-y-12">
        {/* ENQUIRY PORTAL */}
        <div className={`relative rounded-[3rem] border transition-all duration-500 overflow-hidden shadow-2xl ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-white/5 border-white/10'
        }`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.03] via-transparent to-orange-500/[0.03]" />
          <div className="relative p-10 lg:p-12">
            <h3 className={`text-sm font-black uppercase tracking-[0.3em] mb-10 flex items-center gap-3 ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
              <Search size={16} /> Statutory Node Lookup
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); setAppliedFilter(helpLookup); }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">File Reference</label>
                <input
                  type="text"
                  value={helpLookup.caseNumber}
                  onChange={(e) => setHelpLookup((f) => ({ ...f, caseNumber: e.target.value }))}
                  placeholder="CASE-XXXX-000"
                  className={`w-full p-5 rounded-2xl border transition-all outline-none font-bold text-sm uppercase tracking-wider ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-600' : 'bg-black/20 border-white/5 focus:bg-white/10 focus:border-indigo-500'
                  }`}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Filing Timestamp</label>
                <div className={`relative rounded-2xl border transition-all flex items-center pr-12 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 focus-within:border-indigo-600' : 'bg-black/20 border-white/5 focus-within:border-indigo-500'
                }`}>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={helpLookup.date}
                    onChange={(e) => setHelpLookup((f) => ({ ...f, date: e.target.value }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <span className={`px-6 py-5 font-bold text-sm ${helpLookup.date ? (theme === 'light' ? 'text-slate-900' : 'text-white') : 'text-slate-500'}`}>
                    {helpLookup.date ? new Date(helpLookup.date).toLocaleDateString() : 'SELECT DATE'}
                  </span>
                  <Calendar size={20} className="absolute right-5 text-slate-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
                    theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white shadow-indigo-500/20'
                  }`}
                >
                  Initiate Search
                </button>
              </div>
            </form>
          </div> 
        </div>

        {/* REGISTRY TABLE */}
        <div className={`rounded-[3rem] border transition-all duration-500 overflow-hidden shadow-2xl ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <div className={`p-8 border-b transition-colors ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
            <h3 className={`font-black uppercase tracking-widest text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {user?.role === 'citizen' ? 'Active Case Uplinks' : user?.role === 'lawyer' ? 'Retained Client Nodes' : 'Assigned Case Registry'}
            </h3>
          </div>
          
          {casesLoading ? (
            <div className="p-24 text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Accessing Legal Stream...</p>
            </div>
          ) : matchedCases.length === 0 ? (
            <div className="p-24 text-center">
              <Ticket size={48} className="mx-auto mb-6 text-slate-700 opacity-20" />
              <p className={`font-black uppercase tracking-widest text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No matching nodes detected</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'}`}>
                  <tr className={`border-b transition-colors ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Case Reference</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Statutory Phase</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Establish Uplink</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                  {matchedCases.map((c) => (
                    <tr key={c._id} className={`transition-all group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                      <td className="px-8 py-8 font-black text-sm text-indigo-500 font-mono">{c.caseNumber}</td>
                      <td className="px-8 py-8">
                        <p className={`font-black text-sm uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.title}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{c.type} Division • {new Date(c.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-8">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(c.status)}`}>
                          {c.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-8 py-8">
                        <div className="flex flex-wrap gap-2">
                          {user?.role === 'citizen' && (
                            <>
                              <button
                                onClick={() => getCaseUserId(c.assignedPolice) && setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.assignedPolice)!, chatWithLabel: 'Investigating Officer' })}
                                disabled={!getCaseUserId(c.assignedPolice)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                  getCaseUserId(c.assignedPolice) ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white' : 'opacity-20 cursor-not-allowed border-slate-800'
                                }`}
                              >
                                <Shield size={14} className="text-blue-500" /> Police
                              </button>
                              <button
                                onClick={() => getCaseUserId(c.assignedLawyer) && setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.assignedLawyer)!, chatWithLabel: 'Legal Counsel' })}
                                disabled={!getCaseUserId(c.assignedLawyer)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                                  getCaseUserId(c.assignedLawyer) ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white' : 'opacity-20 cursor-not-allowed border-slate-800'
                                }`}
                              >
                                <Gavel size={14} className="text-orange-500" /> Lawyer
                              </button>
                            </>
                          )}
                          {user?.role === 'police' && (
                            <>
                              {getCaseUserId(c.assignedLawyer) && (
                                <button onClick={() => setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.assignedLawyer)!, chatWithLabel: 'Legal Counsel' })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"><Gavel size={14}/> Lawyer</button>
                              )}
                              {getCaseUserId(c.filedBy) && (
                                <button onClick={() => setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.filedBy)!, chatWithLabel: 'Citizen' })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"><User size={14}/> Citizen</button>
                              )}
                            </>
                          )}
                          {user?.role === 'lawyer' && (
                            <>
                              <button onClick={() => getCaseUserId(c.assignedPolice) && setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.assignedPolice)!, chatWithLabel: 'Investigating Officer' })} disabled={!getCaseUserId(c.assignedPolice)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getCaseUserId(c.assignedPolice) ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'opacity-20 border-slate-800'}`}><Shield size={14}/> Police</button>
                              <button onClick={() => getCaseUserId(c.assignedJudge) && setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.assignedJudge)!, chatWithLabel: 'Presiding Judge' })} disabled={!getCaseUserId(c.assignedJudge)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getCaseUserId(c.assignedJudge) ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'opacity-20 border-slate-800'}`}><Zap size={14}/> Judge</button>
                              <button onClick={() => getCaseUserId(c.filedBy) && setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title, chatWithUserId: getCaseUserId(c.filedBy)!, chatWithLabel: 'Citizen' })} disabled={!getCaseUserId(c.filedBy)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getCaseUserId(c.filedBy) ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'opacity-20 border-slate-800'}`}><User size={14}/> Citizen</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* COMMUNICATION PANEL */}
      {selectedCase && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setSelectedCase(null)}>
          <div
            className={`w-full max-w-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col h-full animate-in slide-in-from-right-full duration-700 transition-colors ${
              theme === 'light' ? 'bg-white' : 'bg-[#0a0f1d]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* PANEL HEADER */}
            <div className={`p-10 border-b flex items-center justify-between transition-colors ${
              theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/5 border-white/5'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30"><MessageSquare size={20}/></div>
                  <h3 className={`text-xl font-black uppercase tracking-tighter transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedCase.caseNumber}</h3>
                </div>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-14">Communication with {selectedCase.chatWithLabel}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={fetchMessages} className={`p-4 rounded-2xl transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}><RefreshCw size={20} /></button>
                <button onClick={() => setSelectedCase(null)} className={`p-4 rounded-2xl transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-slate-400 hover:text-red-500' : 'bg-white/5 border-white/5 text-slate-500 hover:text-red-500'}`}><X size={20} /></button>
              </div>
            </div>

            {/* MESSAGES STREAM */}
            <div className={`flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar ${theme === 'light' ? 'bg-slate-50/50' : 'bg-transparent'}`}>
              {chatLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Decrypting Stream...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                   <Zap size={64} className="text-slate-500" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Secure session initialized. Waiting for transmission.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = user?._id && msg.senderId?._id === user._id;
                  return (
                    <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-3`}>
                      <div className={`max-w-[85%] rounded-[2rem] p-6 shadow-2xl transition-all ${
                        isMe ? 'bg-indigo-600 text-white rounded-tr-none' : (theme === 'light' ? 'bg-white border border-slate-100 text-slate-900 rounded-tl-none' : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none')
                      }`}>
                        {!isMe && (
                          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Verified Source: {msg.senderId?.fullName || 'Unknown'}</p>
                        )}
                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={`mt-4 pt-4 border-t flex justify-between items-center gap-10 ${isMe ? 'border-white/10' : 'border-white/5'}`}>
                           <span className={`text-[7px] font-black uppercase tracking-widest ${isMe ? 'text-indigo-200' : 'text-slate-500'}`}>{new Date(msg.createdAt).toLocaleString()}</span>
                           <Globe size={10} className={isMe ? 'text-indigo-200' : 'text-slate-600'} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT HUB */}
            <div className={`p-8 border-t transition-colors ${theme === 'light' ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'}`}>
              <form onSubmit={handleSendMessage} className="relative group">
                <input
                  type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Node Communication..."
                  className={`w-full pl-8 pr-20 py-6 rounded-[2rem] border transition-all outline-none font-bold text-sm uppercase tracking-wider ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' : 'bg-black border-white/10 text-white focus:bg-white/5 focus:border-indigo-500'
                  }`}
                  disabled={chatSending}
                />
                <button
                  type="submit" disabled={chatSending || !chatInput.trim()}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all shadow-xl ${
                    chatSending || !chatInput.trim() ? 'opacity-20 cursor-not-allowed' : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-500/30'
                  }`}
                >
                  {chatSending ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
