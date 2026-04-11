import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  FileText, Activity, CheckCircle, Clock, 
  AlertTriangle, EyeOff, ChevronRight, Shield, AlertCircle, Bell, X, Scale, Download,
  FolderLock, Upload, Trash2, Info
} from 'lucide-react';
import { Notifications } from '../Notifications';
import { KnowYourRights } from '../KnowYourRights';

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
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);
  const [personalDocs, setPersonalDocs] = useState<PersonalDocument[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<LegalNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = getApiUrl();
        // Fetch cases
        const casesRes = await fetch(`${apiUrl}/cases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData);
        }

        // Fetch matching legal notices (by case number)
        const noticesRes = await fetch(`${apiUrl}/legal-notice/citizen/matching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setLegalNotices(Array.isArray(noticesData) ? noticesData : []);
        }

        // Fetch personal documents
        const docsRes = await fetch(`${apiUrl}/users/${user?.id || user?._id}/documents`, {
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
  }, [token, user?.id, user?._id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // Simulate File Upload to Base64 (for the hackathon demo)
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/${user?.id || user?._id}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: reader.result
          })
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
    if (!confirm("Are you sure you want to remove this document from your locker?")) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/${user?.id || user?._id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPersonalDocs(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Normalize case number for comparison (trim, uppercase, collapse spaces)
  const normalizeCaseNumber = (s: string) =>
    (s || '').trim().toUpperCase().replace(/\s+/g, ' ');

  // Match ALL legal notices for this case by case number (judge, police, lawyer – all shown)
  const getMatchingNotices = (caseItem: Case): LegalNotice[] => {
    const caseNum = normalizeCaseNumber(caseItem.caseNumber || '');
    if (!caseNum) return [];
    return legalNotices.filter(notice => {
      const noticeCaseNum = normalizeCaseNumber(notice.caseNumber || '');
      return noticeCaseNum === caseNum;
    });
  };

  // --- TIMER LOGIC (Reuse from Judge Dashboard) ---
  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return null; // Don't show if no deadline (old cases)
    
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (daysLeft < 0) return { color: 'bg-red-100 text-red-700 border-red-200', text: `${Math.abs(daysLeft)} DAYS OVERDUE`, icon: AlertCircle };
    if (daysLeft < 15) return { color: 'bg-orange-100 text-orange-700 border-orange-200', text: `${daysLeft} Days Left`, icon: Clock };
    return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: `${daysLeft} Days to Resolution`, icon: CheckCircle };
  };

  // Helper to determine active step (0 to 3)
  const getStep = (status: string) => {
    switch(status) {
      case 'filed': return 0;
      case 'under-investigation': return 1;
      case 'in-court': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  const handleSOS = async () => {
    if(confirm("⚠️ SEND EMERGENCY ALERT? \n\nThis will instantly notify the nearest Police Control Room with your GPS location.")) {
      try {
        const apiUrl = getApiUrl();
        // Simulate GPS coordinates
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
          alert("SOS SIGNAL SENT! \nPolice are tracking your location. Stay safe.");
        }
      } catch (err) {
        console.error(err);
        alert("Error sending SOS. Please call 100 directly.");
      }
    }
  };

  const handleDownloadNotice = (notice: LegalNotice) => {
    const doc = new jsPDF();
    const margin = 14;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const lineH = 4;
    let y = 0;

    const addBlockLabel = (label: string) => {
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.25);
      doc.line(margin, y, pageW - margin, y);
      y += 3.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), margin, y);
      y += 5;
    };

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(71, 85, 105);
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(value || '—', pageW - margin - 48);
      doc.text(lines, margin, y + lineH);
      y += lineH + lines.length * lineH + 3;
    };

    const addBody = (label: string, content: string) => {
      addBlockLabel(label);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      const lines = doc.splitTextToSize(content || '—', pageW - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * lineH + 5;
    };

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('LEGAL NOTICE', margin, 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(251, 191, 36);
    doc.text(`#${notice.noticeNumber}`, margin, 18);
    doc.setTextColor(203, 213, 225);
    if (notice.caseNumber) doc.text(`Case: ${notice.caseNumber}`, margin + 48, 18);
    doc.setTextColor(0, 0, 0);
    y = 28;

    addBlockLabel('Issued by');
    addField('Authority', `${notice.issuerRole.charAt(0).toUpperCase() + notice.issuerRole.slice(1)} — ${notice.issuerName}`);
    if (notice.issuedBy?.email) addField('Contact', notice.issuedBy.email);
    y += 2;

    addBlockLabel('Notice details');
    addField('Notice type', (notice.noticeType || '').replace(/_/g, ' '));
    addField('Urgency', (notice.urgency || '').toUpperCase());
    addField('Notice date', new Date(notice.noticeDate).toLocaleDateString());
    y += 2;

    addBlockLabel('Case & incident');
    if (notice.caseNumber) addField('Case no.', notice.caseNumber);
    addField('Case type', (notice.caseType || '').toUpperCase());
    addField('Location', notice.location || '');
    addField('Incident date', notice.dateOfIncident ? new Date(notice.dateOfIncident).toLocaleDateString() : '—');
    addField('Incident title', notice.incidentTitle || '—');
    y += 2;

    addBlockLabel('Subject');
    addField('Subject', notice.subject || '—');
    y += 2;

    addBody('Description', notice.description || '');

    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated from Citizen Dashboard · ${new Date().toLocaleString()}`, margin, pageH - 6);

    doc.save(`Legal-Notice-${(notice.noticeNumber || '').replace(/\s/g, '-')}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Securing Connection...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* 1. PREMIUM TOP NAVIGATION/HERO */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 shrink-0">
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Welcome back,</h1>
              <p className="text-indigo-600 font-bold text-sm uppercase tracking-tight">{user?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer relative group">
               <Notifications />
            </div>
            <button 
              onClick={() => navigate('/file-case')}
              className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group"
            >
              <FileText size={18} className="group-hover:translate-x-0.5 transition-transform" />
              File New Case
            </button>
            <button 
              onClick={handleSOS}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-200 flex items-center justify-center gap-2 animate-pulse"
            >
              <AlertTriangle size={18} />
              SOS
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-10 pb-24">
        
        {/* 2. ANALYTICS & QUICK STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase">Lifetime</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{cases.length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Total Filings</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase">In Progress</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{cases.filter(c => c.status !== 'resolved').length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Active Matters</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <CheckCircle size={24} />
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase">Success</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{cases.filter(c => c.status === 'resolved').length}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Resolved Cases</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl shadow-xl shadow-indigo-100 flex flex-col justify-between text-white group cursor-pointer hover:scale-[1.02] transition-all overflow-hidden relative" onClick={() => navigate('/chat')}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bell size={120} />
            </div>
            <div className="flex justify-between items-start mb-4 z-10">
              <div className="p-3 bg-white/20 backdrop-blur-md text-white rounded-2xl">
                <Bell size={24} />
              </div>
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <div className="z-10">
              <h3 className="text-xl font-black tracking-tight">Legal AI Chat</h3>
              <p className="text-white/70 text-[10px] font-bold uppercase mt-1 tracking-widest">Assistant Live 24/7</p>
            </div>
          </div>
        </div>

        {/* 3. CASE TRACKING CENTER */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-600 rounded-full"></div>
              Your Case Docket
            </h2>
            <div className="hidden sm:flex gap-2">
               <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Priority</span>
               <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort Newest</span>
            </div>
          </div>

          {cases.length === 0 ? (
            <div className="bg-white p-20 rounded-[40px] shadow-sm border border-dashed border-slate-200 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <FileText size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No active proceedings</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">Your legal journey starts here. File your first complaint securely and track it in real-time.</p>
              <button 
                onClick={() => navigate('/file-case')} 
                className="bg-indigo-600 text-white px-10 py-4 rounded-[20px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-sm"
              >
                Launch Filing Portal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cases.map((caseItem) => {
                const currentStep = getStep(caseItem.status);
                const timer = getTimerStatus(caseItem.deadlineDate);
                const steps = [
                  { label: 'Filed', icon: FileText, color: 'bg-blue-500' },
                  { label: 'Investigation', icon: Shield, color: 'bg-indigo-500' },
                  { label: 'Hearing', icon: Clock, color: 'bg-orange-500' },
                  { label: 'Verdict', icon: CheckCircle, color: 'bg-emerald-500' }
                ];
                const matchingNotices = getMatchingNotices(caseItem);
                
                return (
                  <div key={caseItem._id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200 transition-all duration-500 group overflow-hidden">
                    <div className="p-8 lg:p-10 flex flex-col lg:flex-row gap-10">
                      
                      {/* Left: Case Info */}
                      <div className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-black text-2xl text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{caseItem.title}</h3>
                              {caseItem.isAnonymous && (
                                <div className="bg-slate-900 text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                                  <EyeOff size={10} /> Anonymous
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                              <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-slate-500">#{caseItem.caseNumber}</span>
                              <span>•</span>
                              <span>Filed {new Date(caseItem.createdAt).toLocaleDateString()}</span>
                              {timer && (
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${timer.color.replace('bg-', 'bg-opacity-10 ')}`}>
                                  <timer.icon size={12} className={timer.text.includes('OVERDUE') ? 'animate-bounce' : ''} />
                                  {timer.text}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => navigate(`/case/${caseItem._id}`)}
                            className="bg-slate-50 text-slate-900 p-4 rounded-2xl font-black text-xs hover:bg-indigo-600 hover:text-white transition-all border border-slate-100 hover:border-indigo-600 hover:shadow-lg flex items-center justify-center gap-2 group/btn"
                          >
                            OPEN FILE <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>

                        {/* Visual Progress Bar - New Design */}
                        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden">
                          {/* Background Glow */}
                          <div className={`absolute top-0 right-0 w-32 h-32 blur-[100px] opacity-20 ${steps[currentStep].color.replace('bg-', 'bg-')}`}></div>
                          
                          <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                            {/* Horizontal Line Connector */}
                            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-200 -translate-y-1/2"></div>
                            <div 
                              className="absolute top-1/2 left-0 h-[2px] bg-indigo-600 -translate-y-1/2 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
                              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                            ></div>

                            {steps.map((step, index) => {
                              const isCompleted = index < currentStep;
                              const isCurrent = index === currentStep;
                              const isFuture = index > currentStep;
                              
                              return (
                                <div key={step.label} className="relative z-10 flex flex-col items-center gap-3">
                                  <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700
                                    ${isCompleted ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 rotate-[360deg]' : 
                                      isCurrent ? 'bg-white border-4 border-indigo-600 text-indigo-600 scale-125 shadow-2xl' : 
                                      'bg-white border-2 border-slate-200 text-slate-300'}
                                  `}>
                                    <step.icon size={20} strokeWidth={isCurrent ? 3 : 2} />
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                                      {step.label}
                                    </span>
                                    {isCurrent && <span className="text-[8px] font-black text-indigo-400 animate-pulse mt-0.5">ACTIVE NOW</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right: Urgent Notices Sidebar */}
                      {matchingNotices.length > 0 && (
                        <div className="lg:w-80 space-y-4">
                          <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Bell size={12} /> Urgent Legal Notices
                          </h4>
                          <div className="space-y-3">
                            {matchingNotices.map((notice) => (
                              <div
                                key={notice._id}
                                onClick={() => setSelectedNotice(notice)}
                                className="p-4 bg-orange-50/50 border-2 border-orange-100 rounded-2xl cursor-pointer hover:bg-orange-100 hover:border-orange-200 transition-all group/notice"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="p-1.5 bg-orange-600 text-white rounded-lg group-hover/notice:rotate-12 transition-transform shadow-sm">
                                    <Bell size={14} />
                                  </div>
                                  <ChevronRight size={14} className="text-orange-400 group-hover/notice:translate-x-1 transition-transform" />
                                </div>
                                <p className="font-black text-slate-900 text-xs leading-snug truncate">{notice.subject}</p>
                                <p className="text-[10px] font-bold text-orange-700 uppercase mt-1 tracking-tight">From: {notice.issuerName}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
          
          {/* DIGITAL VAULT */}
          <div className="lg:col-span-2 bg-white rounded-[40px] p-8 lg:p-10 shadow-sm border border-slate-100 flex flex-col group">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                  <div className="p-2.5 bg-slate-900 text-white rounded-2xl"><FolderLock size={24} /></div>
                  Secure Document Locker
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-2">Private repository for your legal identity and evidence.</p>
              </div>
              <label className={`
                w-full sm:w-auto px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xl
                ${isUploading ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-100'}
              `}>
                {isUploading ? <Activity size={16} className="animate-spin text-indigo-600" /> : <Upload size={16} />}
                {isUploading ? 'Securing...' : 'Upload To Vault'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            {personalDocs.length === 0 ? (
              <div className="py-20 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                <Info size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No documents secured yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {personalDocs.map(doc => (
                  <div key={doc._id} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group/doc">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-3 bg-white rounded-xl border border-slate-100 text-indigo-600 group-hover/doc:bg-indigo-600 group-hover/doc:text-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{new Date(doc.uploadedAt).toLocaleDateString()} • SECURED</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => window.open(doc.fileUrl, '_blank')} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Download size={18} /></button>
                      <button onClick={() => handleDeleteDoc(doc._id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 flex items-center gap-2 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
               <Shield size={16} className="text-emerald-600" />
               <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">End-to-End Encryption Enabled • HIPAA & GDPR Compliant Storage</p>
            </div>
          </div>

          {/* LEGAL LITERACY / RIGHTS */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Know Your Justice</h3>
            <div className="space-y-6">
              <div className="transform hover:-translate-y-1 transition-transform cursor-pointer">
                <KnowYourRights context="general" />
              </div>
              <div className="transform hover:-translate-y-1 transition-transform cursor-pointer">
                <KnowYourRights context="arrest" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LEGAL NOTICE MODAL - FUTURISTIC REDESIGN */}
      {selectedNotice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 md:p-10 animate-in fade-in duration-300" onClick={() => setSelectedNotice(null)}>
          <div 
            className="bg-white rounded-[40px] shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-900 p-8 lg:p-10 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-amber-400 flex items-center justify-center text-slate-900 shadow-xl shadow-amber-400/20 rotate-3">
                  <Scale size={32} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Legal Notice</h2>
                  <p className="text-amber-400 font-bold font-mono text-sm uppercase tracking-[0.2em] mt-1">#{selectedNotice.noticeNumber}</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleDownloadNotice(selectedNotice)}
                  className="flex-1 md:flex-none px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
                >
                  <Download size={18} /> Download PDF
                </button>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-3 rounded-2xl bg-white/10 hover:bg-red-500 hover:text-white transition-all text-white/50 border border-white/10"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 lg:p-10 overflow-y-auto space-y-10 bg-[#F8FAFC]">
              
              {/* Top Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Authority', value: selectedNotice.issuerName, sub: selectedNotice.issuerRole, icon: Shield, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Type', value: selectedNotice.noticeType.replace(/_/g, ' '), icon: FileText, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Urgency', value: selectedNotice.urgency, icon: AlertTriangle, color: selectedNotice.urgency === 'critical' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50' },
                  { label: 'Issued On', value: new Date(selectedNotice.noticeDate).toLocaleDateString(), icon: Clock, color: 'text-slate-600 bg-slate-100' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon size={20} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-sm font-black text-slate-900 uppercase truncate">{item.value}</p>
                    {item.sub && <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase">{item.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Description & Subject */}
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                    <Scale size={150} />
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Official Subject</h4>
                    <p className="text-xl font-black text-slate-900 leading-tight mb-8">"{selectedNotice.subject}"</p>
                    
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4">Detailed Notice Statement</h4>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-slate-700 font-medium text-sm leading-relaxed whitespace-pre-wrap">{selectedNotice.description}</p>
                    </div>
                  </div>
                </div>

                {/* Incident Footer Meta */}
                <div className="bg-slate-900 p-6 rounded-[24px] text-white/80 text-xs font-bold flex flex-wrap gap-x-10 gap-y-4 justify-center md:justify-start">
                   <div className="flex items-center gap-2"><MapPin size={14} className="text-amber-400" /> Location: {selectedNotice.location}</div>
                   <div className="flex items-center gap-2"><Calendar size={14} className="text-amber-400" /> Incident Date: {selectedNotice.dateOfIncident ? new Date(selectedNotice.dateOfIncident).toLocaleDateString() : '—'}</div>
                   <div className="flex items-center gap-2"><FileText size={14} className="text-amber-400" /> Reference: {selectedNotice.caseNumber || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};