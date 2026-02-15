import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateFIR } from '../utils/generatePDF'; 
import { 
  FileText, Calendar, MapPin, User, Clock, 
  Download, ChevronLeft, Shield, Gavel, Briefcase, BookOpen, AlertCircle
} from 'lucide-react';

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
    verifiedAt?: string 
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

  if (loading) return <div className="p-8 text-center">Loading case details...</div>;
  if (!caseData) return <div className="p-8 text-center">Case not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-600 hover:text-slate-900 mb-6 transition">
        <ChevronLeft size={20} /> Back to Cases
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            {/* --- BNS SECTION BADGE IN HEADER --- */}
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
          
          <button
            onClick={() => generateFIR(caseData)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm"
          >
            <Download size={18} /> Download FIR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI CHECKLIST (STAYS HERE FOR DETAILED VIEW) */}
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

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Statement of Facts
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-sm">
              {caseData.description}
            </p>
          </div>

          {/* Timeline */}
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

        {/* Sidebar */}
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">Evidence Vault</h3>
            {caseData.documents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No documents uploaded yet.</p>
            ) : (
              <div className="grid gap-4">
                {caseData.documents.map((doc: any) => (
                  <div key={doc._id} className="flex flex-col p-4 border rounded-lg bg-slate-50 border-slate-200 shadow-sm">
                    <p className="font-semibold text-slate-800 mb-2 truncate text-sm" title={doc.fileName}>{doc.fileName}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        doc.verificationStatus === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : 
                        doc.verificationStatus === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}>
                        {doc.verificationStatus}
                      </span>
                    </div>

                    {(user?.role === 'police' || user?.role === 'lawyer') && doc.verificationStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleVerifyEvidence(doc._id, 'verified')} 
                          className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition w-full shadow-sm"
                        >
                          Verify
                        </button>
                        <button 
                          onClick={() => handleVerifyEvidence(doc._id, 'rejected')} 
                          className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-red-700 transition w-full shadow-sm"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};