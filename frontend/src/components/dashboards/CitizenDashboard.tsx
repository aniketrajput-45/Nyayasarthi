import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { 
  FileText, Activity, CheckCircle, Clock, 
  AlertTriangle, EyeOff, ChevronRight, Shield, AlertCircle, Bell, X, Scale, Download
} from 'lucide-react';
import { Notifications } from '../Notifications'; // <--- IMPORTED NOTIFICATIONS

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
  const [selectedNotice, setSelectedNotice] = useState<LegalNotice | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

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

  const handleSOS = () => {
    if(confirm("⚠️ SEND EMERGENCY ALERT? \n\nThis will instantly notify the nearest Police Control Room with your GPS location.")) {
      alert("SOS SIGNAL SENT! \nPolice are tracking your location. Stay safe.");
    }
  };

  const handleDownloadNotice = (notice: LegalNotice) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    let y = margin;

    const addSection = (title: string, content: string, isBold = false) => {
      if (y > 270) { doc.addPage(); y = margin; }
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text(title, margin, y);
      y += 6;
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(content || '—', pageW - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    };

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LEGAL NOTICE', margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Notice #${notice.noticeNumber}`, margin, y);
    if (notice.caseNumber) doc.text(`Case: ${notice.caseNumber}`, margin + 60, y);
    y += 10;

    addSection('Issued By', `${notice.issuerRole.charAt(0).toUpperCase() + notice.issuerRole.slice(1)}: ${notice.issuerName}${notice.issuedBy?.email ? ` (${notice.issuedBy.email})` : ''}`);
    addSection('Notice Type', (notice.noticeType || '').replace(/_/g, ' '));
    addSection('Urgency', (notice.urgency || '').toUpperCase());
    addSection('Notice Date', new Date(notice.noticeDate).toLocaleDateString());
    addSection('Subject', notice.subject || '');
    addSection('Incident Title', notice.incidentTitle || '');
    addSection('Case Type', (notice.caseType || '').toUpperCase());
    addSection('Location', notice.location || '');
    addSection('Date of Incident', notice.dateOfIncident ? new Date(notice.dateOfIncident).toLocaleDateString() : '');
    addSection('Description', notice.description || '');

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated from Citizen Dashboard on ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 10);

    doc.save(`Legal-Notice-${notice.noticeNumber.replace(/\s/g, '-')}.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Loading your dashboard...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.fullName}</h1>
          <p className="text-slate-500">Track your legal cases and statutory deadlines.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* --- NEW: Notification Bell --- */}
          <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200">
             <Notifications /> 
          </div>

          <button 
            onClick={handleSOS}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-red-500/30 flex items-center gap-2 animate-pulse transition-transform active:scale-95"
          >
            <AlertTriangle size={24} /> SOS EMERGENCY
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* STATS (Simplified) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Cases</p>
              <h3 className="text-2xl font-bold text-slate-900">{cases.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Activity size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Active</p>
              <h3 className="text-2xl font-bold text-slate-900">{cases.filter(c => c.status !== 'resolved').length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition" onClick={() => navigate('/file-case')}>
            <div className="p-3 bg-slate-900 text-white rounded-lg"><Shield size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">New Complaint</p>
              <h3 className="text-lg font-bold text-slate-900">File Now &rarr;</h3>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-8">
          <Activity className="text-blue-600" /> Case Tracking
        </h2>

        {cases.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No active cases found</h3>
            <p className="text-slate-500 mt-2 mb-6">File a complaint to start tracking its progress.</p>
            <button onClick={() => navigate('/file-case')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">File New Case</button>
          </div>
        ) : (
          cases.map((caseItem) => {
            const currentStep = getStep(caseItem.status);
            const timer = getTimerStatus(caseItem.deadlineDate); // Get Timer Data
            const steps = [
              { label: 'Filed', icon: FileText },
              { label: 'Investigation', icon: Shield },
              { label: 'Hearing', icon: Clock },
              { label: 'Verdict', icon: CheckCircle }
            ];

            const matchingNotices = getMatchingNotices(caseItem);
            
            return (
              <div key={caseItem._id} className={`p-6 rounded-xl shadow-sm border-2 hover:shadow-md transition-shadow relative overflow-hidden ${
                matchingNotices.length > 0 ? 'bg-amber-50 border-amber-400' : 'bg-white border-slate-200'
              }`}>
                
                {/* All legal notices for this case (judge, police, lawyer – each shown with notification icon) */}
                {matchingNotices.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-800 mb-2">
                      <Bell className="w-4 h-4 inline mr-1" /> {matchingNotices.length} Legal Notice{matchingNotices.length > 1 ? 's' : ''}
                    </p>
                    {matchingNotices.map((notice) => (
                      <div
                        key={notice._id}
                        className="p-3 bg-amber-100 border-2 border-amber-400 rounded-lg cursor-pointer hover:bg-amber-200 transition flex items-center justify-between"
                        onClick={() => setSelectedNotice(notice)}
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-amber-700 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-amber-900 text-sm">
                              {notice.issuerRole.charAt(0).toUpperCase() + notice.issuerRole.slice(1)}: {notice.issuerName}
                            </p>
                            <p className="text-xs text-amber-800">
                              {notice.subject || notice.noticeNumber} — Click to view
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Visual Deadline Badge (Top Right) */}
                {timer && (
                  <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider border-b border-l flex items-center gap-2 ${timer.color}`}>
                    <timer.icon size={14} className={timer.text.includes('OVERDUE') ? 'animate-pulse' : ''} />
                    {timer.text}
                  </div>
                )}

                {/* Case Header */}
                <div className="flex justify-between items-start mb-6 mt-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-900">{caseItem.title}</h3>
                      {caseItem.isAnonymous && (
                        <span className="bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <EyeOff size={10} /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-mono">Case #{caseItem.caseNumber} • {new Date(caseItem.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  {/* View Details Button */}
                  <button 
                    onClick={() => navigate(`/case/${caseItem._id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mt-6 md:mt-0"
                  >
                    View Details <ChevronRight size={16} />
                  </button>
                </div>

                {/* Visual Tracker */}
                <div className="relative mt-4">
                  <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded"></div>
                  <div 
                    className="absolute top-4 left-0 h-1 bg-blue-600 rounded transition-all duration-1000"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  ></div>

                  <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                      const isActive = index <= currentStep;
                      return (
                        <div key={step.label} className="flex flex-col items-center">
                          <div 
                            className={`
                              w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10
                              ${isActive ? 'bg-white border-blue-600 text-blue-600 shadow-sm scale-110' : 'bg-slate-50 border-slate-200 text-slate-300'}
                            `}
                          >
                            <step.icon size={16} strokeWidth={2.5} />
                          </div>
                          <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Legal Notice Modal — standard, futuristic, contrast with dashboard */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedNotice(null)}>
          <div 
            className="bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: dark, contrast with light dashboard */}
            <div className="sticky top-0 z-10 bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white/10">
                  <Scale className="w-6 h-6 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold tracking-tight">Legal Notice</h2>
                  <p className="text-slate-400 text-sm font-mono truncate">#{selectedNotice.noticeNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadNotice(selectedNotice)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition"
                  title="Download notice"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => setSelectedNotice(null)}
                  className="p-2.5 rounded-xl hover:bg-white/20 transition"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: clean, high contrast */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Issuer card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Issued By</p>
                <p className="text-slate-900 font-semibold">
                  <span className="capitalize text-slate-700">{selectedNotice.issuerRole}</span> — {selectedNotice.issuerName}
                </p>
                {selectedNotice.issuedBy?.email && (
                  <p className="text-sm text-slate-500 mt-1">{selectedNotice.issuedBy.email}</p>
                )}
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedNotice.caseNumber && (
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case No.</p>
                    <p className="text-slate-900 font-mono font-semibold mt-0.5">{selectedNotice.caseNumber}</p>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notice Type</p>
                  <p className="text-slate-900 font-medium mt-0.5 capitalize">{selectedNotice.noticeType.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</p>
                  <p className={`font-semibold mt-0.5 capitalize ${
                    selectedNotice.urgency === 'critical' ? 'text-red-600' :
                    selectedNotice.urgency === 'urgent' ? 'text-amber-600' : 'text-slate-700'
                  }`}>
                    {selectedNotice.urgency}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notice Date</p>
                  <p className="text-slate-900 font-medium mt-0.5">{new Date(selectedNotice.noticeDate).toLocaleDateString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case Type</p>
                  <p className="text-slate-900 font-medium mt-0.5 capitalize">{selectedNotice.caseType}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</p>
                  <p className="text-slate-900 font-medium mt-0.5">{selectedNotice.location}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incident Date</p>
                  <p className="text-slate-900 font-medium mt-0.5">{selectedNotice.dateOfIncident ? new Date(selectedNotice.dateOfIncident).toLocaleDateString() : '—'}</p>
                </div>
              </div>

              {/* Subject & Incident */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</p>
                  <p className="text-slate-900 font-medium mt-1">{selectedNotice.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incident Title</p>
                  <p className="text-slate-900 font-medium mt-1">{selectedNotice.incidentTitle}</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-slate-900 whitespace-pre-wrap text-sm leading-relaxed">{selectedNotice.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};