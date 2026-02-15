import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Calendar, HelpCircle, MessageSquare, Phone, RefreshCw, Ticket, X, Send } from 'lucide-react';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface CaseItem {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  priority?: string;
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
  const [helpLookup, setHelpLookup] = useState({ caseNumber: '', date: '' });
  const [appliedFilter, setAppliedFilter] = useState<{ caseNumber: string; date: string } | null>(null);
  const [myCases, setMyCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCase, setSelectedCase] = useState<{ _id: string; caseNumber: string; title: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
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

  // Load messages when a case chat is opened (same thread for citizen and lawyer)
  useEffect(() => {
    if (!token || !selectedCase) {
      setChatMessages([]);
      return;
    }
    setChatLoading(true);
    setChatError('');
    fetch(`${getApiUrl()}/chat/case/${selectedCase._id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load chat');
        return r.json();
      })
      .then(setChatMessages)
      .catch(() => {
        setChatMessages([]);
        setChatError('Failed to load messages');
      })
      .finally(() => setChatLoading(false));
  }, [token, selectedCase?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchMessages = () => {
    if (!token || !selectedCase) return;
    fetch(`${getApiUrl()}/chat/case/${selectedCase._id}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then(setChatMessages)
      .catch(() => {});
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedCase || !token) return;
    setChatSending(true);
    setChatInput('');
    setChatError('');
    try {
      const res = await fetch(`${getApiUrl()}/chat/case/${selectedCase._id}/message`, {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilter({ caseNumber: helpLookup.caseNumber, date: helpLookup.date });
  };

  const handleRefresh = () => {
    setAppliedFilter(null);
    setHelpLookup({ caseNumber: '', date: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return 'bg-amber-500/15 text-amber-700 border border-amber-500/30';
      case 'under-investigation': return 'bg-sky-500/15 text-sky-700 border border-sky-500/30';
      case 'in-court': return 'bg-orange-500/15 text-orange-700 border border-orange-500/30';
      case 'resolved': return 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30';
      default: return 'bg-slate-500/10 text-slate-700 border border-slate-300';
    }
  };

  return (
    <div className="p-8">
      {/* <h2 className="text-3xl font-bold text-slate-900 mb-8">Case status enquiry</h2> */}
      <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Case status enquiry</h3>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/25 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-2xl shadow-slate-300/20 overflow-hidden ring-1 ring-slate-200/50">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] via-transparent to-indigo-500/[0.03]" />
          <div className="relative p-8">
            {/* <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Case status enquiry</h3>
                <p className="text-sm text-slate-500">Enter Case number and Date to find your case and get the enquiry reference</p>
              </div>
            </div> */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-6">
                <div className="flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Case number</label>
                  <input
                    type="text"
                    value={helpLookup.caseNumber}
                    onChange={(e) => setHelpLookup((f) => ({ ...f, caseNumber: e.target.value }))}
                    placeholder="Enter a case number"
                    className="w-full h-12 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/80 focus:bg-white focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 text-slate-900 placeholder-slate-400 transition font-mono text-sm"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <div className="relative w-full h-12 rounded-xl border border-slate-200 bg-slate-50/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-500/40 focus-within:border-cyan-500 transition pr-11">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={helpLookup.date}
                      onChange={(e) => setHelpLookup((f) => ({ ...f, date: e.target.value }))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label="Enter a date"
                    />
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-sm ${helpLookup.date ? 'text-slate-900' : ''}`}>
                      {helpLookup.date
                        ? (() => {
                            const d = new Date(helpLookup.date + 'T00:00:00');
                            const m = d.getMonth() + 1;
                            const day = d.getDate();
                            const y = d.getFullYear();
                            return `${m}/${day}/${y}`;
                          })()
                        : <span className="text-slate-400">Enter a date</span>}
                    </span>
                    <button
                      type="button"
                      onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition cursor-pointer"
                      aria-label="Open calendar"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 sm:invisible">Submit</label>
                  <button
                    type="submit"
                    className="h-12 w-24 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/25 transition shrink-0 flex items-center justify-center"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </form>
          </div> 
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden ring-1 ring-slate-200/50">
          <div className="p-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 to-cyan-50/30 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900">
                {user?.role === 'citizen' ? 'Raised Concern' : user?.role === 'lawyer' ? 'Accepted Cases' : user?.role === 'police' ? 'Accepted cases' : 'Matched cases'}
              </h3>
              <p className="text-sm text-slate-500">
                {matchedCases.length > 0
                  ? ``
                  : appliedFilter !== null
                    ? ''
                    : user?.role === 'lawyer'
                      ? 'Only cases you have accepted (Accept Client) appear here. Accept cases from the Cases page to chat.'
                      : 'Enter Case number and Date, then click Submit to filter. Click Refresh to show all cases.'}
              </p>
            </div>
          </div>
          {casesLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500 text-sm">Loading your cases...</p>
            </div>
          ) : matchedCases.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">
                {user?.role === 'lawyer' ? 'No accepted cases' : 'No matching cases'}
              </p>
              <p className="text-sm mt-1">
                {user?.role === 'lawyer'
                  ? 'Accept a client from the Cases page to see them here and start chatting.'
                  : ' '}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Case number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Help / Enquiry number</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {matchedCases.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-slate-900">{c.caseNumber}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{c.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 capitalize">{c.type}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusColor(c.status)}`}>
                          {c.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedCase({ _id: c._id, caseNumber: c.caseNumber, title: c.title })}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Chat
                          </button>
                          <span className="font-mono text-xs text-slate-600">
                            {getEnquiryRef(c)}
                          </span>
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

      {/* Case chat panel – same thread for citizen and lawyer */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelectedCase(null)}>
          <div
            className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">{selectedCase.caseNumber}</h3>
                <p className="text-sm text-slate-600 truncate max-w-[240px]">{selectedCase.title}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchMessages()}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                  title="Refresh messages"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCase(null)}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {chatError && (
              <div className="mx-4 mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {chatError}
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {chatLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : chatMessages.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No messages yet. Start the conversation.</p>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = user?._id && msg.senderId?._id === user._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          isMe
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        {!isMe && (
                          <p className="text-xs font-medium text-slate-500 mb-0.5">
                            {msg.senderId?.fullName || 'Unknown'}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-cyan-100' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-900 placeholder-slate-400"
                  disabled={chatSending}
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatInput.trim()}
                  className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
