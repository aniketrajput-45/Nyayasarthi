import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Calendar, MapPin, Scale, Send, 
  AlertCircle, ChevronLeft, Globe, Gavel, Sparkles, Activity
} from 'lucide-react';

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

interface CaseOption {
  _id: string;
  caseNumber: string;
  title: string;
  type: string;
  location?: string;
  incidentDate?: string;
}

export const LegalNotice: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [caseOptions, setCaseOptions] = useState<CaseOption[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);

  const [formData, setFormData] = useState({
    noticeType: 'cease_and_desist',
    urgency: 'normal',
    noticeDate: new Date().toISOString().split('T')[0],
    subject: '',
    caseNumber: '', 
    incidentTitle: '',
    caseType: 'civil',
    location: '',
    dateOfIncident: '',
    description: '',
  });

  useEffect(() => {
    const fetchCases = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${getApiUrl()}/cases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCaseOptions(Array.isArray(data) ? data : []);
        }
      } catch (err) { console.error(err); } finally { setCasesLoading(false); }
    };
    fetchCases();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    const name = e.target.name;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'caseNumber' && value) {
        const selected = caseOptions.find(c => c.caseNumber === value);
        if (selected) {
          next.incidentTitle = selected.title || prev.incidentTitle;
          next.caseType = selected.type || prev.caseType;
          next.location = selected.location || prev.location;
          next.dateOfIncident = selected.incidentDate ? new Date(selected.incidentDate).toISOString().split('T')[0] : prev.dateOfIncident;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${getApiUrl()}/legal-notice/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, issuerName: user?.fullName || '' })
      });
      if (res.ok) { navigate('/cases'); }
      else { setError('Transmission failure. Authority node rejected request.'); }
    } catch (err) { setError('Network anomaly. Secure sync failed.'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-orange-500/30 overflow-x-hidden">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-[100] border-b border-white/5 bg-[#070b14]/80 backdrop-blur-2xl px-6 lg:px-12 py-4">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-slate-400 hover:text-white transition-all group font-black text-[10px] uppercase tracking-widest">
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white group-hover:text-slate-950 transition-all"><ChevronLeft size={16} /></div>
            Abort Session
          </button>
          <div className="px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2 text-indigo-400">
             <Scale size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Legal Authority Protocol</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 pb-32">
        <header className="relative">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight relative z-10">Broadcast Official <br/><span className="text-orange-500">Statutory Notice</span></h1>
          <p className="mt-4 text-slate-400 text-sm font-bold uppercase tracking-widest max-w-lg leading-relaxed relative z-10">Issue a legally binding transmission across the judicial network. Authentication required.</p>
        </header>

        {error && (
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] flex items-center gap-4 animate-in shake duration-500">
            <div className="p-2 bg-red-500 text-white rounded-lg shadow-xl shadow-red-500/20"><AlertCircle size={20} /></div>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          
          {/* SECTION 1: PROTOCOL TYPE */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 lg:p-12 space-y-10">
            <div className="flex items-center gap-4 border-b border-white/5 pb-8">
              <div className="p-3 bg-white/5 text-orange-500 rounded-2xl border border-white/10"><Scale size={24} /></div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Transmission Metadata</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Protocol Type</label>
                <select name="noticeType" value={formData.noticeType} onChange={handleChange} required className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest appearance-none cursor-pointer">
                  <option value="cease_and_desist">CEASE AND DESIST</option>
                  <option value="demand">DEMAND NOTICE</option>
                  <option value="eviction">EVICTION PROTOCOL</option>
                  <option value="breach">BREACH OF CONTRACT</option>
                  <option value="defamation">DEFAMATION SUIT</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Urgency Level</label>
                <select name="urgency" value={formData.urgency} onChange={handleChange} required className={`w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest appearance-none cursor-pointer ${formData.urgency === 'critical' ? 'text-red-500' : 'text-orange-400'}`}>
                  <option value="normal">NORMAL PRIORITY</option>
                  <option value="urgent">URGENT PRIORITY</option>
                  <option value="critical">CRITICAL / IMMEDIATE</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Transmission Date</label>
                <input type="date" name="noticeDate" value={formData.noticeDate} onChange={handleChange} required className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Broadcast Subject</label>
                <input name="subject" value={formData.subject} onChange={handleChange} required placeholder="OFFICIAL TITLE OF NOTICE" className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" />
              </div>
            </div>
          </div>

          {/* SECTION 2: CASE MAPPING */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 lg:p-12 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03]"><Globe size={200} /></div>
            <div className="flex items-center gap-4 border-b border-white/5 pb-8 relative z-10">
              <div className="p-3 bg-white/5 text-indigo-400 rounded-2xl border border-white/10"><Activity size={24} /></div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Incident Node Mapping</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Existing Case Node (Optional)</label>
                <select name="caseNumber" value={formData.caseNumber} onChange={handleChange} className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest appearance-none">
                  <option value="">MANUAL BROADCAST</option>
                  {caseOptions.map(c => <option key={c._id} value={c.caseNumber}>{c.caseNumber} — {c.title}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Incident Title</label>
                <input name="incidentTitle" value={formData.incidentTitle} onChange={handleChange} required placeholder="COMPLAINT REFERENCE" className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Node Geo-Tag</label>
                <input name="location" value={formData.location} onChange={handleChange} required placeholder="LOCATION OF ORIGIN" className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Incident Timestamp</label>
                <input type="date" name="dateOfIncident" value={formData.dateOfIncident} onChange={handleChange} required className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" />
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Statutory Statement</label>
              <textarea name="description" value={formData.description} onChange={handleChange} required rows={6} className="w-full p-8 bg-white/5 border border-white/10 rounded-[2rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-medium text-sm leading-relaxed uppercase tracking-tight" placeholder="Formal detailed description of notice grounds..." />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button type="button" onClick={() => navigate('/cases')} className="px-10 py-6 bg-white/5 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Abort Broadcast</button>
            <button disabled={loading} type="submit" className="flex-1 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-white/5 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-[1.01] flex items-center justify-center gap-4">
              {loading ? <Activity className="animate-spin" /> : <Send size={20} />}
              {loading ? "INITIALIZING UPLINK..." : "EXECUTE BROADCAST"}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};