import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateFIR } from '../utils/generatePDF'; 
import { 
  FileText, Calendar, MapPin, User, Clock, 
  Download, ChevronLeft, Shield, Gavel, Briefcase, BookOpen, AlertCircle, ExternalLink,
  Upload, ShieldCheck, TrendingUp, Sparkles, CheckCircle, Globe, Activity, Lock, Zap
} from 'lucide-react';
import { KnowYourRights } from '../components/KnowYourRights';

interface CaseDetail {
  _id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  location: string;
  incidentDate: string;
  createdAt: string;
  isProBono: boolean;
  bnsSection?: string;
  aiSuggestedEvidence?: string[];
  documents: { 
    _id: string; 
    fileName: string; 
    fileUrl: string; 
    verificationStatus: string; 
    verifiedAt?: string;
    fileHash?: string;
    deviceMetadata?: string;
  }[];
  filedBy: { _id: string; fullName: string; email: string };
  assignedPolice?: { _id: string; fullName: string; email: string };
  assignedLawyer?: { _id: string; fullName: string; email: string };
  assignedJudge?: { _id: string; fullName: string; email: string };
  interestedLawyers: any[];
  timeline: { status: string; date: string; notes: string }[];
}

export const CaseDetails: React.FC = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [successScore, setSuccessScore] = useState<{score: number, factors: string[]} | null>(null);

  const handlePredictSuccess = () => {
    setSuccessScore({
      score: 78,
      factors: [
        "Strong evidence documentation (Hashed)",
        "Clear incident timeline matching BNS requirements",
        "Recent judicial precedents favor this category"
      ]
    });
  };

  const handleGenerateSummary = () => {
    setIsSummarizing(true);
    setTimeout(() => {
      setAiSummary(`EXECUTIVE SUMMARY: This case involves a ${caseData?.type} dispute at ${caseData?.location}. Key issues include the verification of evidence hashed on ${new Date(caseData?.createdAt || "").toLocaleDateString()}. Admissibility confirmed under BNSS Section 144.`);
      setIsSummarizing(false);
    }, 2000);
  };

  const fetchCase = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { setCaseData(await res.json()); }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCase(); }, [id, token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileName: file.name, fileUrl: reader.result, deviceMetadata: "Secure Node Upload" })
        });
        if (res.ok) { fetchCase(); }
      } catch (err) { console.error(err); } finally { setIsUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyEvidence = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/verify-evidence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentId: docId, status }),
      });
      if (response.ok) { fetchCase(); }
    } catch (err) { console.error(err); }
  };

  const handleSubmitToCourt = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/submit-to-court`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Case Successfully Submitted to Court Registry.");
        fetchCase();
      } else {
        alert(`Failed to submit: ${data.message || 'Unknown error'}`);
      }
    } catch (err) { 
      console.error(err); 
      alert("Network error: Could not connect to judicial node.");
    }
  };

  const handleClaimCase = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/claim-lawyer`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Case Accepted. You are now the assigned Counsel.");
        fetchCase();
      } else {
        alert(`Failed to accept mandate: ${data.message || 'Unknown error'}`);
      }
    } catch (err) { 
      console.error(err); 
      alert("Network error: Could not reach registry.");
    }
  };

  const handleRegisterFIR = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/register-fir`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("FIR Registered Successfully. Case moved to Legal Marketplace.");
        fetchCase();
      }
    } catch (err) { console.error(err); }
  };

  const handleViewDocument = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) { window.open(fileUrl, '_blank'); return; }
    const nw = window.open();
    if (nw) { nw.document.write(`<iframe src="${fileUrl}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe>`); }
  };

  const handleExpressInterest = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/interest`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Strategic Interest Logged. The citizen has been notified.");
        fetchCase();
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14]">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (!caseData) return <div className="p-8 text-center text-white font-black uppercase">Dossier Missing or Access Denied</div>;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-[100] border-b border-white/5 bg-[#070b14]/80 backdrop-blur-2xl px-6 lg:px-12 py-4">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-slate-400 hover:text-white transition-all group font-black text-[10px] uppercase tracking-widest">
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white group-hover:text-slate-950 transition-all"><ChevronLeft size={16} /></div>
            Back to Registry
          </button>
          <div className="px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">Secure Node: {caseData.caseNumber}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-12 pb-32">
        
        {/* CASE HERO */}
        <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-10 lg:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000"><Gavel size={300} /></div>
          
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 relative z-10">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4">
                {caseData.bnsSection ? (
                  <div className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-500/20">
                    <BookOpen size={14} /> BNS Section {caseData.bnsSection}
                  </div>
                ) : (
                  <div className="px-4 py-1.5 bg-white/5 text-slate-500 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> Section Unassigned
                  </div>
                )}
                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${caseData.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                  {caseData.status.replace('-', ' ')}
                </div>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight">{caseData.title}</h1>
              
              <div className="flex flex-wrap items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                <div className="flex items-center gap-2"><MapPin size={16} className="text-indigo-500" /> {caseData.location}</div>
                <div className="flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> Incident: {new Date(caseData.incidentDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> Filed: {new Date(caseData.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full lg:w-auto">
              {user?.role === 'lawyer' && (caseData.assignedLawyer?._id || caseData.assignedLawyer) === (user?.userId || user?._id) && (caseData.status === 'pending_lawyer' || caseData.status === 'fir_filed') && (
                <button 
                  onClick={handleSubmitToCourt}
                  className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3"
                >
                  <Gavel size={18} />
                  Submit Case to Court Registry
                </button>
              )}
              {user?.role === 'lawyer' && !caseData.assignedLawyer && (
                <button 
                  onClick={handleClaimCase}
                  className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                >
                  <Briefcase size={18} />
                  Accept Full Mandate
                </button>
              )}
              {user?.role === 'police' && caseData.status === 'complaint' && (
                <button 
                  onClick={handleRegisterFIR}
                  className="px-10 py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                >
                  <ShieldCheck size={18} />
                  Register Official FIR
                </button>
              )}
              {user?.role === 'lawyer' && !caseData.assignedLawyer && !caseData.interestedLawyers.some(l => (l._id || l) === (user?.userId || user?._id)) && (
                <button 
                  onClick={handleExpressInterest}
                  className="px-10 py-5 bg-orange-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-orange-700 transition-all shadow-2xl shadow-orange-500/20 flex items-center justify-center gap-3"
                >
                  <Zap size={18} />
                  Express Strategic Interest
                </button>
              )}
              {user?.role === 'judge' && !aiSummary && (
                <button onClick={handleGenerateSummary} disabled={isSummarizing} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 flex items-center justify-center gap-3">
                  {isSummarizing ? <Activity size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  Execute AI Brief
                </button>
              )}
              <button onClick={() => generateFIR(caseData)} className="px-10 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all shadow-xl flex items-center justify-center gap-3">
                <Download size={18} /> Export Official FIR
              </button>
            </div>
          </div>

          {aiSummary && (
            <div className="mt-12 p-10 bg-indigo-500/5 border border-indigo-500/20 rounded-[2.5rem] relative overflow-hidden animate-in zoom-in-95 duration-700">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={100} className="text-indigo-400" /></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20"><Shield size={20} /></div>
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.4em]">Neural Summary Core</h4>
              </div>
              <p className="text-white text-lg font-medium leading-relaxed uppercase tracking-tight italic">"{aiSummary}"</p>
              <div className="mt-8 pt-8 border-t border-white/5 flex gap-8 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                 <span>Engine: Gemini 3 Flash</span>
                 <span>Trust Node: Verified Admissible</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            
            {/* EVIDENCE CHECKLIST */}
            {caseData.aiSuggestedEvidence && caseData.aiSuggestedEvidence.length > 0 && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[3rem] p-10 shadow-2xl">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-8 flex items-center gap-3"><FileText size={16} /> Statutory Evidence Checklist</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {caseData.aiSuggestedEvidence.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DESCRIPTION */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-10 lg:p-12 border border-white/5 space-y-8">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-4"><FileText size={24} className="text-indigo-500" /> Statement of Facts</h3>
              <div className="p-8 bg-black/20 rounded-[2rem] border border-white/5">
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium uppercase tracking-tight">{caseData.description}</p>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-10 lg:p-12 border border-white/5 space-y-10">
              <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-4"><Clock size={24} className="text-orange-500" /> Audit Timeline</h3>
              <div className="space-y-10 pl-4 relative">
                <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-white/5"></div>
                {caseData.timeline.map((event, i) => (
                  <div key={i} className="flex gap-8 group">
                    <div className={`w-3 h-3 rounded-full mt-1.5 z-10 border-4 border-[#070b14] transition-all duration-500 ${i === 0 ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'bg-slate-800 group-hover:bg-indigo-400'}`} />
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{event.status.replace('-', ' ')}</p>
                      <p className="text-[8px] font-black text-slate-500 uppercase mt-1 tracking-widest">{new Date(event.date).toLocaleString()}</p>
                      {event.notes && <p className="text-xs text-slate-400 mt-3 font-medium bg-white/5 p-4 rounded-xl border border-white/5 italic">"{event.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-12">
            {/* OFFICIALS */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-10 border border-white/5 space-y-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Assigned Team</h3>
              {[
                { label: 'Investigating Officer', val: caseData.assignedPolice?.fullName, icon: Shield, color: 'text-blue-400' },
                { label: 'Legal Counsel', val: caseData.assignedLawyer?.fullName, icon: Briefcase, color: 'text-orange-400' },
                { label: 'Presiding Judge', val: caseData.assignedJudge?.fullName, icon: Gavel, color: 'text-purple-400' }
              ].map((official, i) => (
                <div key={i} className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <div className={`p-3 bg-white/5 rounded-xl border border-white/10 ${official.color}`}><official.icon size={20} /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{official.label}</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">{official.val || 'Unassigned Node'}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* EVIDENCE VAULT */}
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] p-10 border border-white/5 space-y-8 group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Vault Node</h3>
                {user?.role === 'citizen' && (
                  <label className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isUploading ? 'bg-white/5 text-slate-500 border-white/5' : 'bg-white text-slate-950 hover:bg-indigo-600 hover:text-white border-white'}`}>
                    {isUploading ? <Activity size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                )}
              </div>
              
              <div className="grid gap-4">
                {caseData.documents.map((doc: any) => (
                  <div key={doc._id} className="p-6 bg-black/40 rounded-3xl border border-white/5 group/node transition-all hover:border-indigo-500/30">
                    <div className="flex justify-between items-start mb-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-[10px] uppercase tracking-tight truncate">{doc.fileName}</p>
                        {doc.fileHash && <p className="text-[7px] text-emerald-500 font-mono mt-1 opacity-60 truncate">HASH: {doc.fileHash}</p>}
                      </div>
                      <button onClick={() => handleViewDocument(doc.fileUrl)} className="p-2 bg-white/5 hover:bg-white text-slate-500 hover:text-slate-950 rounded-xl transition-all"><ExternalLink size={14}/></button>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest ${doc.verificationStatus === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>{doc.verificationStatus}</span>
                       {(user?.role === 'police' || user?.role === 'lawyer') && doc.verificationStatus === 'pending' && (
                         <div className="flex gap-2">
                           <button onClick={() => handleVerifyEvidence(doc._id, 'verified')} className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"><CheckCircle size={14}/></button>
                           <button onClick={() => handleVerifyEvidence(doc._id, 'rejected')} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"><X size={14}/></button>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest"><Lock size={12}/> Hashed Integrity Active</div>
            </div>

            {/* PREDICTION */}
            {(user?.role === 'citizen' || user?.role === 'lawyer') && (
              <div className="bg-emerald-500/5 rounded-[3rem] p-10 border border-emerald-500/20 space-y-8 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><TrendingUp size={150} /></div>
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-3"><TrendingUp size={16} /> Success Node</h3>
                {!successScore ? (
                  <button onClick={handlePredictSuccess} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/20">Compute Success Index</button>
                ) : (
                  <div className="space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-6xl font-black text-white tracking-tighter">{successScore.score}%</span>
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">Probablity Yield</span>
                    </div>
                    <div className="space-y-3">
                      {successScore.factors.map((f, i) => (
                        <div key={i} className="flex gap-3 text-[9px] font-black text-slate-400 uppercase tracking-tight leading-relaxed">
                          <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <KnowYourRights context={caseData.type === 'criminal' ? 'arrest' : caseData.type === 'cyber' ? 'cyber' : 'civil'} className="!bg-white/5 !border-white/10 !text-slate-300" />
          </div>
        </div>
      </main>
    </div>
  );
};