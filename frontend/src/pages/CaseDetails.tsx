import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateFIR } from '../utils/generatePDF'; 
import { 
  FileText, Calendar, MapPin, User, Clock, 
  Download, ChevronLeft, Shield, Gavel, Briefcase, BookOpen, AlertCircle, ExternalLink,
  Upload, ShieldCheck, TrendingUp, Sparkles, CheckCircle
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
  filedBy: { fullName: string; email: string };
  assignedPolice?: { fullName: string; email: string };
  assignedLawyer?: { fullName: string; email: string };
  assignedJudge?: { fullName: string; email: string };
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
    // Simulate AI Prediction
    setSuccessScore({
      score: 78,
      factors: [
        "Strong evidence documentation",
        "Clear incident timeline",
        "Recent judicial precedents favor this category"
      ]
    });
  };

  const handleGenerateSummary = () => {
    setIsSummarizing(true);
    // Simulate Gemini AI Summarization
    setTimeout(() => {
      setAiSummary(`EXECUTIVE SUMMARY: This case involves a ${caseData?.type} dispute at ${caseData?.location}. Key issues include the verification of evidence hashed on ${new Date(caseData?.createdAt || "").toLocaleDateString()}. Recommendation: Immediate hearing for preliminary evidence review.`);
      setIsSummarizing(false);
    }, 2000);
  };

  const fetchCase = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCaseData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [id, token]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/evidence`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fileName: file.name,
            fileUrl: reader.result,
            deviceMetadata: "Citizen Secure Upload"
          })
        });
        if (res.ok) {
          fetchCase();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyEvidence = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/verify-evidence`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId: docId, status }),
      });

      if (response.ok) {
        fetchCase(); 
      }
    } catch (err) {
      console.error("Verification failed", err);
    }
  };

  const handleViewDocument = (fileUrl: string) => {
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
      return;
    }
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(
        `<iframe src="${fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
    } else {
      alert("Please allow pop-ups in your browser to view this document.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading case details...</div>;
  if (!caseData) return <div className="p-8 text-center">Case not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition">
        <ChevronLeft size={20} /> Back to Cases
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            {caseData.bnsSection ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold mb-3 bg-blue-600 text-white border border-blue-700 shadow-sm">
                 <BookOpen size={14} /> Applicable Law: BNS Section {caseData.bnsSection}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold mb-3 bg-slate-100 text-slate-600 border border-slate-200">
                 <AlertCircle size={14} /> Section Not Assigned
              </div>
            )}

            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{caseData.title}</h1>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-mono">
                {caseData.caseNumber}
              </span>
              {caseData.isProBono && (
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold border border-purple-200">
                  PRO BONO
                </span>
              )}
            </div>
            <p className="text-slate-500 flex items-center gap-2 text-sm">
              <MapPin size={16} /> {caseData.location} • 
              <Calendar size={16} /> Incident: {new Date(caseData.incidentDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-2">
            {user?.role === 'judge' && !aiSummary && (
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-bold text-sm"
              >
                {isSummarizing ? <Clock size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isSummarizing ? "AI Analyzing..." : "Generate AI Brief"}
              </button>
            )}
            <button
              onClick={() => generateFIR(caseData)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
            >
              <Download size={18} /> Download FIR
            </button>
          </div>
        </div>

        {aiSummary && (
          <div className="mt-6 p-6 bg-indigo-50 border border-indigo-100 rounded-xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={80} className="text-indigo-600" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg"><Shield size={16} /></div>
              <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-widest">Gemini AI Executive Brief</h4>
            </div>
            <p className="text-indigo-800 text-sm leading-relaxed font-medium">
              {aiSummary}
            </p>
            <div className="mt-4 flex gap-4 text-[10px] font-bold text-indigo-400 uppercase">
               <span>Generated by Gemini 3 Flash</span>
               <span>•</span>
               <span>Confidence Score: 94%</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {caseData.aiSuggestedEvidence && caseData.aiSuggestedEvidence.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Required Evidence Checklist
              </h4>
              <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
                {caseData.aiSuggestedEvidence.map((doc: string, idx: number) => (
                  <li key={idx}>{doc}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Statement of Facts
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
              {caseData.description}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Clock size={20} className="text-orange-600" /> Case Timeline
            </h3>
            <div className="space-y-6">
              {caseData.timeline.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-600" />
                    {index !== caseData.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 my-1" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 capitalize text-sm">{event.status.replace('-', ' ')}</p>
                    <p className="text-xs text-slate-500">{new Date(event.date).toLocaleString()}</p>
                    {event.notes && <p className="text-sm text-slate-600 mt-1 italic">"{event.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Assigned Officials</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Shield size={18} className="text-blue-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Investigating Officer</p>
                  <p className="text-sm font-medium text-slate-900">{caseData.assignedPolice?.fullName || "Not Assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg"><Briefcase size={18} className="text-orange-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Legal Counsel</p>
                  <p className="text-sm font-medium text-slate-900">{caseData.assignedLawyer?.fullName || "Not Assigned"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg"><Gavel size={18} className="text-purple-600" /></div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Presiding Judge</p>
                  <p className="text-sm font-medium text-slate-900">{caseData.assignedJudge?.fullName || "Not Assigned"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Evidence Vault</h3>
              {user?.role === 'citizen' && (
                <label className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer
                  ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}
                `}>
                  {isUploading ? <Clock size={14} className="animate-spin" /> : <Upload size={14} />}
                  {isUploading ? 'Hashing...' : 'Add Evidence'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              )}
            </div>
            {caseData.documents.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 italic">No secured evidence found.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {caseData.documents.map((doc: any) => (
                  <div key={doc._id} className="flex flex-col p-4 border rounded-lg bg-slate-50 border-slate-200 shadow-sm relative overflow-hidden">
                    {doc.fileHash && (
                      <div className="absolute top-0 right-0 p-1 bg-green-600 text-white" title="Verified Integrity (Hashed)">
                        <ShieldCheck size={12} />
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <p className="font-semibold text-slate-800 truncate text-sm" title={doc.fileName}>{doc.fileName}</p>
                      {doc.fileUrl && (
                        <button onClick={() => handleViewDocument(doc.fileUrl)} type="button" className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-[10px] font-bold uppercase transition shrink-0 cursor-pointer">
                          <ExternalLink size={12} /> View
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : 
                          doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                          {doc.verificationStatus}
                        </span>
                      </div>
                      {doc.fileHash && <p className="text-[9px] font-mono text-slate-500 truncate" title={doc.fileHash}>HASH: {doc.fileHash}</p>}
                    </div>
                    {(user?.role === 'police' || user?.role === 'lawyer') && doc.verificationStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyEvidence(doc._id, 'verified')} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition w-full shadow-sm">Verify</button>
                        <button onClick={() => handleVerifyEvidence(doc._id, 'rejected')} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition w-full shadow-sm">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck size={12} className="text-green-600" /> All evidence is cryptographically hashed.
            </p>
          </div>

          {(user?.role === 'citizen' || user?.role === 'lawyer') && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" /> Success Prediction
              </h3>
              {!successScore ? (
                <button onClick={handlePredictSuccess} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
                  <Sparkles size={18} /> Predict Case Success
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                  <div className="flex flex-col items-center justify-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="text-4xl font-black text-emerald-600">{successScore.score}%</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Probability of Success</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Contributing Factors:</p>
                    {successScore.factors.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <KnowYourRights context={caseData.type === 'criminal' ? 'arrest' : caseData.type === 'cyber' ? 'cyber' : 'civil'} />
        </div>
      </div>
    </div>
  );
};