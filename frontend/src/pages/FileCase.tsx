import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, EyeOff, Users, FileText, MapPin, Calendar, Info, CheckCircle, BookOpen, UploadCloud, MousePointer2 } from 'lucide-react';
import { VisualTriage } from '../components/VisualTriage';

export const FileCase: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillData = location.state as any; 

  const [loading, setLoading] = useState(false);
  const [showTriage, setShowTriage] = useState(!prefillData);
  
  // State to hold selected files for upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    title: prefillData?.title || '',
    description: prefillData?.description || '', 
    type: prefillData?.type || 'civil',          
    location: '',
    incidentDate: '',
    isAnonymous: false,
    shareWithLegalAid: false,
    isProBono: false,
    bnsSection: prefillData?.bnsSection || '',                  
    aiSuggestedEvidence: prefillData?.requiredEvidence || []    
  });

  const handleTriageSelect = (category: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      type: category === 'commercial' ? 'corporate' : category === 'family' ? 'civil' : category === 'other' ? 'civil' : category,
      title: `${title}: `
    }));
    setShowTriage(false);
  };

  // This ensures the form updates with new AI data even if the page was already open
  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({
        ...prev,
        description: prefillData.description || prev.description,
        type: prefillData.type || prev.type,
        bnsSection: prefillData.bnsSection || prev.bnsSection,
        aiSuggestedEvidence: prefillData.requiredEvidence || prev.aiSuggestedEvidence
      }));
    }
  }, [prefillData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  // Convert File to Base64 String
  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Process real files to Base64
      const uploadedDocuments = await Promise.all(
        selectedFiles.map(async (file) => {
          const base64Data = await toBase64(file);
          return {
            fileName: file.name,
            fileUrl: base64Data, // We pass the real file data string here!
            verificationStatus: 'pending' 
          };
        })
      );

      // Merge the documents into the final payload
      const payload = {
        ...formData,
        documents: uploadedDocuments
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload) 
      });

      if (res.ok) {
        alert("Case and Evidence Filed Successfully! Redirecting to Dashboard...");
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
        
        {/* SECTION 0: VISUAL TRIAGE */}
        {showTriage ? (
          <div className="space-y-6">
            <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
              <MousePointer2 size={18} className="text-blue-600"/> Select Incident Type
            </h3>
            <VisualTriage onSelect={handleTriageSelect} />
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
              <Info size={18} className="text-slate-400 mt-0.5" />
              <p className="text-xs text-slate-500 italic">Choosing a category helps our AI suggest the correct BNS sections and evidence required for your specific case.</p>
            </div>
          </div>
        ) : (
          <button 
            type="button" 
            onClick={() => setShowTriage(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            &larr; Re-select Incident Category
          </button>
        )}

        {/* AI SUGGESTED EVIDENCE CHECKLIST UI (Only shows if there is AI data) */}
        {formData.aiSuggestedEvidence && formData.aiSuggestedEvidence.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h3 className="text-blue-900 font-semibold flex items-center gap-2 mb-3">
              <CheckCircle size={18} /> AI Case Builder Active
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Based on your chat, this incident falls under <strong>BNS Section {formData.bnsSection}</strong>. 
              To avoid delays, please ensure you have the following documents ready to upload in the section below:
            </p>
            <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1 mb-2">
              {formData.aiSuggestedEvidence.map((doc: string, idx: number) => (
                <li key={idx}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

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
               <select name="type" value={formData.type} onChange={handleChange} className="w-full p-2.5 border rounded-lg bg-white">
                 <option value="civil">Civil Dispute</option>
                 <option value="criminal">Criminal Offence</option>
                 <option value="cyber">Cyber Crime</option>
                 <option value="corporate">Corporate</option>
               </select>
            </div>
            
            {/* BNS SECTION INPUT FIELD */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Applicable Law (BNS Section)</label>
              <div className="relative">
                <BookOpen size={18} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  name="bnsSection" 
                  value={formData.bnsSection} 
                  onChange={handleChange} 
                  className="w-full p-2.5 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/50" 
                  placeholder="e.g. 318" 
                />
              </div>
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
            <textarea name="description" value={formData.description} onChange={handleChange} required rows={8} className="w-full p-2.5 border rounded-lg" placeholder="Describe exactly what happened..." />
          </div>
        </div>

        {/* --- NEW SECTION: ALWAYS VISIBLE EVIDENCE UPLOAD --- */}
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
            <UploadCloud size={18} className="text-green-600"/> Evidence Vault Upload
          </h3>
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Attach Documents, Images, or PDFs securely to this case.
            </label>
            <input 
              type="file" 
              multiple 
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 p-2"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-700 uppercase mb-2">Files ready to submit ({selectedFiles.length})</p>
                <ul className="list-inside list-disc text-sm text-slate-600 space-y-1">
                  {selectedFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* -------------------------------------------------- */}

        {/* SECTION 3: PRIVACY & OPTIONS */}
        <div className="space-y-4 pt-4">
          <h3 className="font-semibold text-slate-900 border-b pb-2 flex items-center gap-2">
            <Shield size={18} className="text-purple-600"/> Privacy & Legal Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
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

            <label className="relative flex items-start p-4 border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group">
              <div className="flex items-center h-5">
                <input 
                  name="shareWithLegalAid" 
                  type="checkbox" 
                  onChange={(e) => {
                    handleChange(e);
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