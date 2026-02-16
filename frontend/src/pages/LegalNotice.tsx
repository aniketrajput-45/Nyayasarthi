import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Scale, 
  Send,
  AlertCircle
} from 'lucide-react';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
    caseNumber: '', // Case Number (optional)
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
      } catch (err) {
        console.error(err);
      } finally {
        setCasesLoading(false);
      }
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          issuerName: user?.fullName || user?.name || '',
          caseNumber: formData.caseNumber,
          incidentTitle: formData.incidentTitle,
          caseType: formData.caseType,
          location: formData.location,
          dateOfIncident: formData.dateOfIncident,
        })
      });

      let data = {};
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json().catch(() => ({}));
      }
      if (res.ok) {
        alert("Legal Notice issued successfully! Notice ID: " + (data.noticeNumber || data._id));
        navigate('/cases');
      } else {
        const msg = data.message || data.error || (res.status === 403 ? 'Access denied. Only Judge, Lawyer, or Police can issue notices.' : res.status === 401 ? 'Please log in again.' : `Error (${res.status}). Please try again.`);
        setError(msg);
      }
    } catch (err) {
      console.error(err);
      setError('Network or server error. Check the console and ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const noticeTypeOptions = [
    { value: 'cease_and_desist', label: 'Cease and Desist Notice' },
    { value: 'demand', label: 'Demand Notice' },
    { value: 'eviction', label: 'Eviction Notice' },
    { value: 'termination', label: 'Termination Notice' },
    { value: 'breach', label: 'Breach of Contract Notice' },
    { value: 'defamation', label: 'Defamation Notice' },
    { value: 'recovery', label: 'Recovery Notice' },
    { value: 'other', label: 'Other Legal Notice' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Issue Legal Notice</h1>
            <p className="text-slate-600 mt-2">Formally notify parties with a legally compliant notice document.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80 space-y-8">
        
        {/* SECTION 1: NOTICE INFORMATION */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 border-b-2 border-indigo-100 pb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Notice Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Notice Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <select 
                  name="noticeType" 
                  value={formData.noticeType} 
                  onChange={handleChange} 
                  required
                  className="w-full p-3 pl-11 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                >
                  {noticeTypeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Urgency Level <span className="text-red-500">*</span>
              </label>
              <select 
                name="urgency" 
                value={formData.urgency} 
                onChange={handleChange} 
                required
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="normal">Normal (Standard Processing)</option>
                <option value="urgent">Urgent (Expedited Processing)</option>
                <option value="critical">Critical (Immediate Action Required)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Notice Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="date" 
                  name="noticeDate" 
                  value={formData.noticeDate} 
                  onChange={handleChange} 
                  required
                  className="w-full p-3 pl-11 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange} 
                required
                placeholder="e.g., Notice for Breach of Contract dated..."
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: INCIDENT DETAILS (For Matching) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 border-b-2 border-indigo-100 pb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" /> Incident Details (For Case Matching)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Case Number
              </label>
              <select
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white font-mono"
              >
                <option value="">Select case number</option>
                {casesLoading ? (
                  <option disabled>Loading cases...</option>
                ) : (
                  caseOptions.map((c) => (
                    <option key={c._id} value={c.caseNumber}>
                      {c.caseNumber} — {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Incident Title <span className="text-red-500">*</span>
              </label>
              <input 
                name="incidentTitle" 
                value={formData.incidentTitle} 
                onChange={handleChange} 
                required
                placeholder="e.g., Theft of Vehicle"
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Case Type <span className="text-red-500">*</span>
              </label>
              <select 
                name="caseType" 
                value={formData.caseType} 
                onChange={handleChange} 
                required
                className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
              >
                <option value="civil">Civil Dispute</option>
                <option value="criminal">Criminal Offence</option>
                <option value="cyber">Cyber Crime</option>
                <option value="corporate">Corporate</option>
                <option value="commercial">Commercial</option>
                <option value="family">Family</option>
                <option value="property">Property</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  required
                  placeholder="e.g., MG Road, Bangalore"
                  className="w-full p-3 pl-11 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Date of Incident <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="date" 
                  name="dateOfIncident" 
                  value={formData.dateOfIncident} 
                  onChange={handleChange} 
                  required
                  className="w-full p-3 pl-11 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              required
              rows={6}
              placeholder="Provide a detailed description of the incident and the legal notice..."
              className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-6 border-t-2 border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => navigate('/cases')}
              className="px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button 
              disabled={loading} 
              type="submit"
              className="flex-1 max-w-md ml-auto px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Issuing Notice...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Issue Legal Notice
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
