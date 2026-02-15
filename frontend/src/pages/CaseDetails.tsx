import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateFIR } from '../utils/generatePDF'; // Import your PDF tool
import { 
  FileText, Calendar, MapPin, User, Clock, 
  Download, ChevronLeft, Shield, Gavel, Briefcase 
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
  documents: { fileName: string; fileUrl: string }[];
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

  useEffect(() => {
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
    fetchCase();
  }, [id, token]);

  if (loading) return <div className="p-8">Loading case details...</div>;
  if (!caseData) return <div className="p-8">Case not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-600 hover:text-slate-900 mb-6">
        <ChevronLeft size={20} /> Back to Cases
      </button>

      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
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
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <Download size={18} /> Download FIR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Statement of Facts
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {caseData.description}
            </p>
          </div>

          {/* Evidence/Documents */}
          {caseData.documents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Evidence & Documents</h3>
              <div className="grid grid-cols-2 gap-4">
                {caseData.documents.map((doc, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg flex items-center gap-3">
                    <FileText className="text-slate-400" />
                    <span className="text-sm text-slate-700 truncate">{doc.fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
                    <p className="font-medium text-slate-900 capitalize">{event.status.replace('-', ' ')}</p>
                    <p className="text-sm text-slate-500">{new Date(event.date).toLocaleString()}</p>
                    {event.notes && <p className="text-sm text-slate-600 mt-1">{event.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: People Involved */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Assigned Officials</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg"><Shield size={18} className="text-blue-600" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Investigating Officer</p>
                  <p className="text-sm font-medium text-slate-900">
                    {caseData.assignedPolice?.fullName || "Not Assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-lg"><Briefcase size={18} className="text-orange-600" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Legal Counsel</p>
                  <p className="text-sm font-medium text-slate-900">
                    {caseData.assignedLawyer?.fullName || "Not Assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg"><Gavel size={18} className="text-purple-600" /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Presiding Judge</p>
                  <p className="text-sm font-medium text-slate-900">
                    {caseData.assignedJudge?.fullName || "Not Assigned"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};