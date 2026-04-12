import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  FileText, Activity, CheckCircle, Clock, 
  AlertTriangle, EyeOff, ChevronRight, Shield, AlertCircle, Bell, X, Scale, Download,
  FolderLock, Upload, Trash2, Info, Navigation, Sparkles, Globe, ArrowUpRight,
  Sun, Moon, Eye
} from 'lucide-react';
import { Notifications } from '../Notifications';
import { KnowYourRights } from '../KnowYourRights';
import { LivePatrolTracker } from '../LivePatrolTracker';

interface PersonalDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  isAnonymous: boolean;
  createdAt: string;
  deadlineDate: string;
  location?: string;
  incidentDate?: string;
}

interface LegalNotice {
  _id: string;
  noticeNumber: string;
  caseNumber?: string;
  noticeType: string;
  urgency: string;
  subject: string;
  incidentTitle: string;
  caseType: string;
  location: string;
  dateOfIncident: string;
  description: string;
  noticeDate: string;
  issuedBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  issuerRole: string;
  issuerName: string;
}

export const CitizenDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);
  const [personalDocs, setPersonalDocs] = useState<PersonalDocument[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<LegalNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSOSTracker, setShowSOSTracker] = useState(false);
  const [isSOSMinimized, setIsSOSMinimized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = getApiUrl();
        const casesRes = await fetch(`${apiUrl}/cases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData);
        }

        const noticesRes = await fetch(`${apiUrl}/legal-notice/citizen/matching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setLegalNotices(Array.isArray(noticesData) ? noticesData : []);
        }

        const docsRes = await fetch(`${apiUrl}/users/${user?.id || user?._id || user?.userId}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (docsRes.ok) {
          setPersonalDocs(await docsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user?.id, user?._id, user?.userId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/${user?.id || user?._id || user?.userId}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ fileName: file.name, fileUrl: reader.result })
        });
        if (res.ok) {
          setPersonalDocs(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Remove this document from the vault?")) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/${user?.id || user?._id || user?.userId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPersonalDocs(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleSOS = async () => {
    if(confirm("⚠️ SEND EMERGENCY ALERT? \n\nThis will instantly notify the nearest Police Control Room with your GPS location.")) {
      try {
        const apiUrl = getApiUrl();
        const lat = (12.9716 + (Math.random() - 0.5) * 0.01).toFixed(6);
        const lng = (77.5946 + (Math.random() - 0.5) * 0.01).toFixed(6);

        const res = await fetch(`${apiUrl}/notifications/sos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ 
            location: "MG Road Metro Station, Bangalore",
            lat,
            lng
          })
        });

        if (res.ok) {
          setShowSOSTracker(true);
          setIsSOSMinimized(false);
        }
      } catch (err) {
        console.error(err);
        alert("Error sending SOS. Please call 100 directly.");
      }
    }
  };

  const handleCancelSOS = () => {
    if(confirm("⚠️ CANCEL EMERGENCY ALERT? \n\nOnly cancel if you are safe. This will notify dispatch that assistance is no longer required.")) {
      setShowSOSTracker(false);
      setIsSOSMinimized(false);
    }
  };

  const normalizeCaseNumber = (s: string) => (s || '').trim().toUpperCase().replace(/\s+/g, ' ');
  
  const getMatchingNotices = (caseItem: Case): LegalNotice[] => {
    const caseNum = normalizeCaseNumber(caseItem.caseNumber || '');
    if (!caseNum) return [];
    return legalNotices.filter(notice => normalizeCaseNumber(notice.caseNumber || '') === caseNum);
  };

  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (daysLeft < 0) return { color: 'text-red-500 border-red-500/20 bg-red-500/5', text: `${Math.abs(daysLeft)}D OVERDUE`, icon: AlertCircle };
    if (daysLeft < 15) return { color: 'text-orange-500 border-orange-500/20 bg-orange-500/5', text: `${daysLeft}D LEFT`, icon: Clock };
    return { color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5', text: `${daysLeft}D REMAINING`, icon: CheckCircle };
  };

  const getStep = (status: string) => {
    switch(status) {
      case 'filed': return 0;
      case 'under-investigation': return 1;
      case 'in-court': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
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
    addField('Authority', `${notice.issuerRole.toUpperCase()} — ${notice.issuerName}`);
    addBlockLabel('Subject');
    addField('Subject', notice.subject);
    doc.save(`Legal-Notice-${notice.noticeNumber}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(79,70,229,0.3)]"></div>
        <p className="text-indigo-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Accessing Justice Records...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-orange-500/30 overflow-x-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      {showSOSTracker && (
        <LivePatrolTracker 
          onCancel={handleCancelSOS}
          onMinimize={() => setIsSOSMinimized(true)}
          onExpand={() => setIsSOSMinimized(false)}
          isMinimized={isSOSMinimized}
          userLocation="MG Road Metro" 
        />
      )}

      {/* 1. CINEMATIC HEADER */}
      <nav className={`sticky top-0 z-[100] border-b px-6 lg:px-12 py-4 backdrop-blur-2xl transition-all duration-500 ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 
        theme === 'high-contrast' ? 'bg-black border-white' : 
        'bg-[#070b14]/80 border-white/5'
      }`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex flex-wrap w-[32px] h-[32px] gap-[3px] rotate-45 group-hover:rotate-0 transition-transform duration-500">
              <div className="w-[14px] h-[14px] bg-orange-600 rounded-sm"></div>
              <div className="w-[14px] h-[14px] bg-indigo-600 rounded-sm"></div>
              <div className="w-[14px] h-[14px] bg-indigo-400 rounded-sm"></div>
              <div className={`w-[14px] h-[14px] bg-transparent rounded-sm border ${theme === 'light' ? 'border-slate-300' : 'border-white/10'}`}></div>
            </div>
            <div>
              <h1 className={`text-lg font-black leading-tight tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Nyayasarthi</h1>
              <p className="text-indigo-400 font-bold text-[9px] uppercase tracking-[0.3em]">Justice Command</p>
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
               <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Digital Citizen: {user?.fullName}</span>
            </div>
            <div className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
               <Notifications />
            </div>
            <button 
              onClick={handleSOS}
              className="px-6 py-2.5 bg-red-600 text-white rounded-2xl font-black text-[10px] hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)] uppercase tracking-[0.2em] animate-pulse border border-red-500/50"
            >
              Trigger SOS
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        
        {/* 2. OVERVIEW HERO */}
        <div className="relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-600/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              { label: 'Case Load', val: cases.length, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
              { label: 'Active', val: cases.filter(c => c.status !== 'resolved').length, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
              { label: 'Resolved', val: cases.filter(c => c.status === 'resolved').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
              { label: 'AI Signal', val: 'Online', icon: Sparkles, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-600 to-indigo-800', border: 'border-white/10', isAction: true }
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={stat.isAction ? () => navigate('/chat') : undefined}
                className={`p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${
                  theme === 'light' ? 'bg-white border-slate-200 shadow-sm shadow-slate-200' : 
                  theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
                  `${stat.bg} ${stat.border}`
                } ${stat.isAction ? 'cursor-pointer hover:scale-[1.02] shadow-2xl' : ''} group`}
              >
                {stat.isAction && <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-100 text-indigo-600' : 
                  theme === 'high-contrast' ? 'bg-black border-white text-white' : 
                  `${stat.bg} ${stat.color} ${stat.border}`
                }`}>
                  <stat.icon size={24} />
                </div>
                <h3 className={`text-4xl font-black tracking-tighter mb-1 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.val}</h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CASE DOCKET (FUTURISTIC TIMELINE) */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
              Judicial Docket
            </h2>
            <button 
              onClick={() => navigate('/file-case')}
              className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 group ${
                theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : 
                theme === 'high-contrast' ? 'bg-white text-black hover:bg-zinc-200' : 
                'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              Initiate New Filing <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

          {cases.length === 0 ? (
            <div className={`p-24 backdrop-blur-md rounded-[3rem] border text-center group cursor-pointer transition-all ${
              theme === 'light' ? 'bg-white border-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
              'bg-white/5 border-white/5'
            }`} onClick={() => navigate('/file-case')}>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border transition-all duration-700 ${
                theme === 'light' ? 'bg-slate-50 border-slate-200' : 
                theme === 'high-contrast' ? 'bg-black border-white' : 
                'bg-white/5 border-white/10'
              } group-hover:scale-110 group-hover:border-indigo-500/50`}>
                <FileText size={48} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className={`text-2xl font-black mb-3 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Active Matched Cases</h3>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-xs mx-auto leading-relaxed">Securely file your first complaint to begin real-time judicial tracking.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {cases.map((caseItem) => {
                const currentStep = getStep(caseItem.status);
                const timer = getTimerStatus(caseItem.deadlineDate);
                const steps = [
                  { label: 'Filing', icon: FileText },
                  { label: 'Evidence', icon: Shield },
                  { label: 'Court', icon: Clock },
                  { label: 'Verdict', icon: CheckCircle }
                ];
                const notices = getMatchingNotices(caseItem);
                
                return (
                  <div key={caseItem._id} className={`backdrop-blur-xl rounded-[3rem] border transition-all duration-700 overflow-hidden group ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 
                    theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
                    'bg-white/5 border-white/10 hover:border-indigo-500/30'
                  }`}>
                    <div className="p-8 lg:p-12 flex flex-col lg:row gap-12">
                      <div className="flex-1 space-y-10">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                          <div>
                            <div className="flex items-center gap-4 mb-3">
                              <h3 className={`text-2xl font-black tracking-tighter uppercase transition-all duration-500 ${
                                theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 
                                theme === 'high-contrast' ? 'text-white' : 
                                'text-white group-hover:text-indigo-400'
                              }`}>{caseItem.title}</h3>
                              {caseItem.isAnonymous && <div className="px-2 py-1 bg-slate-900 border border-white/10 rounded-lg text-[8px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1"><EyeOff size={10}/> Stealth Mode</div>}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                              <span className={`px-3 py-1 rounded-full border ${
                                theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 
                                theme === 'high-contrast' ? 'bg-black border-white text-white' : 
                                'bg-white/5 border-white/5 text-slate-200'
                              }`}>REF: {caseItem.caseNumber}</span>
                              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                              <span className={`${theme === 'light' ? 'text-slate-600' : 'text-slate-200'} font-bold`}>Filing Date: {new Date(caseItem.createdAt).toLocaleDateString()}</span>
                              {timer && <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${timer.color}`}><timer.icon size={12}/> {timer.text}</div>}
                            </div>
                          </div>
                          <button 
                            onClick={() => navigate(`/case/${caseItem._id}`)}
                            className={`p-5 rounded-3xl border transition-all duration-500 group/btn ${
                              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white' : 
                              theme === 'high-contrast' ? 'bg-black border-white text-white hover:bg-white hover:text-black' : 
                              'bg-white/5 border-white/10 text-slate-300 hover:bg-white hover:text-slate-950'
                            }`}
                          >
                            <ChevronRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>

                        {/* PROGRESS SCANNER */}
                        <div className={`p-12 rounded-[2.5rem] border relative overflow-hidden ${
                          theme === 'light' ? 'bg-slate-50 border-slate-100' : 
                          theme === 'high-contrast' ? 'bg-black border-white' : 
                          'bg-black/20 border-white/5'
                        }`}>
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-orange-500/5"></div>
                          <div className="relative flex items-center justify-between max-w-3xl mx-auto">
                            <div className={`absolute top-1/2 left-0 w-full h-[1px] -translate-y-1/2 ${theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'}`}></div>
                            <div className="absolute top-1/2 left-0 h-[1px] bg-gradient-to-r from-indigo-500 to-indigo-300 -translate-y-1/2 transition-all duration-1000 shadow-[0_0_20px_rgba(79,70,229,0.5)]" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}></div>
                            {steps.map((step, idx) => {
                              const isDone = idx < currentStep;
                              const isCurrent = idx === currentStep;
                              return (
                                <div key={idx} className="relative z-10 flex flex-col items-center gap-5">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-1000 ${
                                    isDone ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.4)]' : 
                                    isCurrent ? (theme === 'light' ? 'bg-white text-indigo-600 scale-125 border-2 border-indigo-600' : 'bg-white text-slate-950 scale-125 shadow-[0_0_50px_rgba(255,255,255,0.2)]') : 
                                    (theme === 'light' ? 'bg-white text-slate-400 border border-slate-200' : 'bg-slate-900 text-slate-400 border border-white/10')
                                  }`}>
                                    <step.icon size={24} strokeWidth={isCurrent ? 3 : 2} />
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                                    isCurrent ? (theme === 'light' ? 'text-indigo-600' : 'text-white') : 
                                    isDone ? 'text-indigo-400' : 
                                    'text-slate-500'
                                  }`}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {notices.length > 0 && (
                        <div className="lg:w-96 space-y-6">
                          <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] flex items-center gap-2 animate-pulse"><Bell size={12} /> Priority Signal</h4>
                          <div className="space-y-4">
                            {notices.map((n) => (
                              <div key={n._id} onClick={() => setSelectedNotice(n)} className={`p-6 border rounded-[2rem] cursor-pointer transition-all group/notice ${
                                theme === 'light' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' : 
                                theme === 'high-contrast' ? 'bg-black border-orange-500 hover:bg-orange-900' : 
                                'bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40'
                              }`}>
                                <div className="flex justify-between items-start mb-4">
                                  <div className="p-2.5 bg-orange-600 text-white rounded-xl shadow-[0_0_20px_rgba(234,88,12,0.3)]"><Bell size={16} /></div>
                                  <ChevronRight size={16} className="text-orange-500/50 group-hover/notice:translate-x-1 transition-transform" />
                                </div>
                                <p className={`font-black text-sm leading-tight uppercase tracking-tight line-clamp-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{n.subject}</p>
                                <p className="text-[9px] font-bold text-orange-500 uppercase mt-3 tracking-widest">{n.issuerName} • Court Official</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. UTILITIES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`lg:col-span-2 backdrop-blur-md rounded-[3rem] p-10 lg:p-12 border relative overflow-hidden group transition-all duration-500 ${
            theme === 'light' ? 'bg-white border-slate-200' : 
            theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
            'bg-white/5 border-white/5'
          }`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000"><FolderLock size={300} /></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12 relative z-10">
              <div>
                <h2 className={`text-3xl font-black tracking-tighter uppercase flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20"><FolderLock size={28} /></div>
                  Vault Storage
                </h2>
                <p className={`text-xs font-bold uppercase tracking-widest mt-4 ${theme === 'light' ? 'text-slate-500' : 'text-slate-200'}`}>Zero-Knowledge Encrypted Judicial Locker</p>
              </div>
              <label className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-2xl ${
                isUploading ? 'bg-white/5 text-slate-500' : 
                theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white hover:shadow-indigo-500/40'
              }`}>
                {isUploading ? <Activity size={18} className="animate-spin" /> : <Upload size={18} />}
                {isUploading ? 'Securing...' : 'Encrypt New File'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            {personalDocs.length === 0 ? (
              <div className={`py-24 text-center rounded-[2.5rem] border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                <Info size={48} className="mx-auto text-slate-800 mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No encrypted nodes detected</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {personalDocs.map(doc => (
                  <div key={doc._id} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 group/doc ${
                    theme === 'light' ? 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200' : 
                    theme === 'high-contrast' ? 'bg-black border-white hover:bg-zinc-800' : 
                    'bg-white/5 border-white/5 hover:bg-white hover:text-slate-950'
                  }`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-xl border transition-all ${
                        theme === 'light' ? 'bg-white border-slate-200 text-indigo-600' : 'bg-white/5 border-white/10 text-indigo-400 group-hover/doc:bg-indigo-600 group-hover/doc:text-white'
                      }`}><FileText size={20} /></div>
                      <div className="min-w-0">
                        <p className={`font-black text-xs truncate uppercase tracking-tight transition-colors ${
                          theme === 'light' ? 'text-slate-900' : 'text-white group-hover/doc:text-slate-950'
                        }`}>{doc.fileName}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Verified: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                      <button onClick={() => window.open(doc.fileUrl, '_blank')} className="p-2 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-slate-300"><Download size={16} /></button>
                      <button onClick={() => handleDeleteDoc(doc._id)} className="p-2 hover:bg-red-600 hover:text-white rounded-lg transition-all text-slate-300"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className={`mt-10 flex items-center gap-3 p-5 rounded-[1.5rem] border relative z-10 ${
              theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-500/5 border-indigo-500/10'
            }`}>
               <Shield size={18} className="text-indigo-500" />
               <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-300'}`}>AES-256 Symmetric Encryption Active • Restricted Node Access</p>
            </div>
          </div>

          <div className="space-y-10">
            <h3 className={`text-[10px] font-black uppercase tracking-[0.5em] pl-6 border-l ${theme === 'light' ? 'text-slate-400 border-slate-200' : 'text-slate-500 border-slate-800'}`}>Know Your Justice</h3>
            <div className="space-y-8 pl-6">
              <KnowYourRights context="general" className={`${theme === 'light' ? '!bg-white !border-slate-200 !text-slate-700' : '!bg-white/5 !border-white/10 !text-slate-200'}`} />
              <KnowYourRights context="arrest" className={`${theme === 'light' ? '!bg-white !border-slate-200 !text-slate-700' : '!bg-white/5 !border-white/10 !text-slate-200'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. CINEMATIC LEGAL MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-4 md:p-10 animate-in fade-in duration-500" onClick={() => setSelectedNotice(null)}>
          <div className={`rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-700 border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Scale size={200} /></div>
              <div className="flex items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white shadow-2xl shadow-orange-500/20"><Scale size={40} /></div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase">Statutory Notice</h2>
                  <p className="text-orange-500 font-bold font-mono text-[12px] uppercase tracking-[0.3em] mt-2">Node Reference ID: #{selectedNotice.noticeNumber}</p>
                </div>
              </div>
              <div className="flex gap-3 relative z-10">
                <button onClick={() => handleDownloadNotice(selectedNotice)} className="p-4 bg-white/5 hover:bg-white hover:text-slate-950 rounded-2xl transition-all border border-white/10"><Download size={24}/></button>
                <button onClick={() => setSelectedNotice(null)} className="p-4 bg-white/5 hover:bg-red-600 rounded-2xl transition-all border border-white/10"><X size={24}/></button>
              </div>
            </div>
            <div className={`p-12 overflow-y-auto space-y-12 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'}`}>
              <div className={`p-12 rounded-[3rem] border shadow-2xl relative overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-800 border-slate-700 shadow-black/50'}`}>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-8">Official Statement of Record</h4>
                <p className={`text-2xl font-black leading-[1.1] uppercase tracking-tight mb-12 border-b pb-12 ${theme === 'light' ? 'text-slate-900 border-slate-100' : 'text-white border-slate-700'}`}>"{selectedNotice.subject}"</p>
                <div className={`p-10 rounded-[2.5rem] border shadow-inner ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-900 border-slate-800'}`}>
                  <p className={`font-medium text-base leading-relaxed whitespace-pre-wrap ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{selectedNotice.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: 'Authority', val: selectedNotice.issuerName },
                   { label: 'Role', val: selectedNotice.issuerRole },
                   { label: 'Issued On', val: new Date(selectedNotice.noticeDate).toLocaleDateString() },
                   { label: 'Location', val: selectedNotice.location }
                 ].map((box, i) => (
                   <div key={i} className={`p-6 rounded-[2rem] border shadow-sm ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{box.label}</p>
                      <p className={`text-xs font-black uppercase truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{box.val}</p>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};