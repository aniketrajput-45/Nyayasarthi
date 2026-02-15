import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Shield, EyeOff, Users, FileText, MapPin, Calendar, Info } from 'lucide-react';

export const FileCase: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'civil', // default
    location: '',
    incidentDate: '',
    
    // --- NEW FIELDS ---
    isAnonymous: false,
    shareWithLegalAid: false,
    isProBono: false // We will link this to 'shareWithLegalAid'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert("Case Filed Successfully! Redirecting to Dashboard...");
        navigate('/cases');
      } else {
        alert("Error filing case. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">File a New Complaint</h1>
        <p className="text-slate-500 mt-2">Securely submit your legal grievance to the authorities.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
        
        {/* SECTION 1: CASE DETAILS */}
        <div className="space-y-6">
          <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Info size={18} className="text-blue-600"/> Case Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Incident Title</label>
              <input name="title" onChange={handleChange} required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Theft of Vehicle" />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Case Type</label>
               <select name="type" onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white">
                 <option value="civil">Civil Dispute</option>
                 <option value="criminal">Criminal Offence</option>
                 <option value="cyber">Cyber Crime</option>
                 <option value="corporate">Corporate</option>
               </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-slate-400" />
                <input name="location" onChange={handleChange} required className="w-full p-2.5 pl-10 border rounded-lg" placeholder="e.g. MG Road, Bangalore" />
              </div>
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Date of Incident</label>
               <div className="relative">
                 <Calendar size={18} className="absolute left-3 top-3 text-slate-400" />
                 <input type="date" name="incidentDate" onChange={handleChange} required className="w-full p-2.5 pl-10 border rounded-lg" />
               </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
            <textarea name="description" onChange={handleChange} required rows={4} className="w-full p-2.5 border rounded-lg" placeholder="Describe exactly what happened..." />
          </div>
        </div>

        {/* SECTION 2: PRIVACY & OPTIONS (THE NEW FEATURE) */}
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Shield size={18} className="text-purple-600"/> Privacy & Legal Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* OPTION 1: ANONYMOUS */}
            <label className="relative flex items-start p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className="flex items-center h-5">
                <input name="isAnonymous" type="checkbox" onChange={handleChange} className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-slate-900 flex items-center gap-2">
                  <EyeOff size={16} className="text-slate-500 group-hover:text-purple-600"/> File Anonymously
                </span>
                <p className="text-slate-500 mt-1">Hide your name from public records. Only the Investigating Officer will see your identity.</p>
              </div>
            </label>

            {/* OPTION 2: LEGAL AID */}
            <label className="relative flex items-start p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className="flex items-center h-5">
                <input 
                  name="shareWithLegalAid" 
                  type="checkbox" 
                  onChange={(e) => {
                    handleChange(e);
                    // Automatically check isProBono if this is checked
                    setFormData(prev => ({ ...prev, isProBono: e.target.checked })); 
                  }} 
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" 
                />
              </div>
              <div className="ml-3 text-sm">
                <span className="font-medium text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-slate-500 group-hover:text-purple-600"/> Request Legal Aid
                </span>
                <p className="text-slate-500 mt-1">Share this case with registered lawyers to find free (Pro Bono) legal representation.</p>
              </div>
            </label>

          </div>
        </div>

        <div className="pt-4">
          <button disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-lg font-bold shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2">
            {loading ? "Filing Case..." : <> <FileText size={20}/> Submit Official Complaint </>}
          </button>
        </div>

      </form>
    </div>
  );
};