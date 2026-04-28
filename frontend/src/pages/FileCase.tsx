import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, EyeOff, Users, FileText, MapPin, Calendar, 
  Info, CheckCircle, BookOpen, UploadCloud, MousePointer2, 
  ChevronLeft, Sparkles, Gavel, Globe, Activity, AlertCircle 
} from 'lucide-react';
import { VisualTriage } from '../components/VisualTriage';

export const FileCase: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefillData = location.state as any; 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showTriage, setShowTriage] = useState(!prefillData);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [formData, setFormData] = useState({
    title: prefillData?.title || '',
    description: prefillData?.description || '', 
    type: prefillData?.type || 'civil',          
    location: prefillData?.location || user?.address || '',
    incidentDate: prefillData?.incidentDate || '',
    isAnonymous: false,
    shareWithLegalAid: false,
    isProBono: false,
    bnsSection: prefillData?.bnsSection || '',                  
    aiSuggestedEvidence: prefillData?.requiredEvidence || []    
  });

  // Automatically try to get GPS on mount for routing and pre-filling address
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          
          // If location is still empty, try to get a human readable address from GPS
          if (!formData.location) {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
              const data = await res.json();
              if (data.display_name) {
                setFormData(prev => ({ ...prev, location: data.display_name }));
              }
            } catch (e) {
              console.warn("Reverse geocoding failed.");
            }
          }
        },
        () => console.warn("GPS access denied for case filing."),
        { timeout: 5000 }
      );
    }
  }, []);

  const handleTriageSelect = (category: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      type: category === 'commercial' ? 'corporate' : category === 'family' ? 'civil' : category === 'other' ? 'civil' : category,
      title: `${title}: `
    }));
    setShowTriage(false);
  };

  useEffect(() => {
    if (prefillData) {
      setFormData(prev => ({
        ...prev,
        description: prefillData.description || prev.description,
        type: prefillData.type || prev.type,
        bnsSection: prefillData.bnsSection || prev.bnsSection,
        aiSuggestedEvidence: prefillData.requiredEvidence || prev.aiSuggestedEvidence,
        title: prefillData.title || prev.title,
        location: prefillData.location || prev.location,
        incidentDate: prefillData.incidentDate || prev.incidentDate
      }));
    }
  }, [prefillData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

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
    setError('');
    setLoading(true);
    try {
      const uploadedDocuments = await Promise.all(
        selectedFiles.map(async (file) => {
          const base64Data = await toBase64(file);
          return { fileName: file.name, fileUrl: base64Data, verificationStatus: 'pending' };
        })
      );
      
      const payload = { 
        ...formData, 
        documents: uploadedDocuments,
        lat: coords?.lat,
        lng: coords?.lng
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload) 
      });

      const data = await res.json();

      if (res.ok) { 
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        // Fix: Extract detailed validation errors if they exist
        const errorMsg = data.details && data.details.length > 0 
          ? `${data.message}: ${data.details.join(', ')}` 
          : (data.error || data.message || 'Filing rejected by registry');
        throw new Error(errorMsg);
      }
    } catch (err) { 
      console.error(err); 
      setError(err instanceof Error ? err.message : 'A neural link error occurred.');
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-[100] border-b border-white/5 bg-[#070b14]/80 backdrop-blur-2xl px-6 lg:px-12 py-4">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-slate-400 hover:text-white transition-all group font-black text-[10px] uppercase tracking-widest">
            <div className="p-2 bg-white/5 rounded-xl group-hover:bg-white group-hover:text-slate-950 transition-all"><ChevronLeft size={16} /></div>
            Back to Dashboard
          </button>
          <div className="hidden sm:flex items-center gap-4">
            <div className="px-6 py-2.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-2">
               <Globe size={14} className="text-indigo-500" />
               <span className="text-[10px] font-black uppercase tracking-widest">Secure Filing Portal</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6 lg:p-12 space-y-12 pb-32">
        <header className="relative">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter uppercase leading-tight relative z-10">Initiate Judicial <br/><span className="text-indigo-500">Record Entry</span></h1>
          <p className="mt-4 text-slate-400 text-sm font-bold uppercase tracking-widest max-w-lg leading-relaxed relative z-10">Securely submit your grievance to the digital court node. All data is end-to-end encrypted.</p>
        </header>

        {error && (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] flex items-start gap-4 animate-in slide-in-from-top-2 duration-500">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-black text-sm uppercase tracking-tight">Submission Interrupted</p>
              <p className="text-red-400/80 text-xs font-bold uppercase mt-1 tracking-widest leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-start gap-4 animate-in zoom-in-95 duration-500">
            <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-500 font-black text-sm uppercase tracking-tight">Node Entry Successful</p>
              <p className="text-emerald-400/80 text-xs font-bold uppercase mt-1 tracking-widest leading-relaxed">Case file successfully committed to the judicial registry. Redirecting to dashboard...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          
          {/* STEP 0: VISUAL TRIAGE */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 lg:p-12 overflow-hidden group">
            {showTriage ? (
              <div className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20"><MousePointer2 size={24} /></div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Classify Incident Node</h3>
                </div>
                <VisualTriage onSelect={handleTriageSelect} />
                <div className="p-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/10 flex items-start gap-4">
                  <Info size={20} className="text-indigo-500 shrink-0 mt-1" />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-relaxed">Classification helps the neural engine suggest relevant BNS sections and evidence nodes automatically.</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20"><CheckCircle size={20} /></div>
                  <span className="text-xs font-black text-white uppercase tracking-widest tracking-tight">Category Selected</span>
                </div>
                <button type="button" onClick={() => setShowTriage(true)} className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] hover:text-white transition-colors">Change Category &rarr;</button>
              </div>
            )}
          </div>

          {!showTriage && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* AI SUGGESTED EVIDENCE */}
              {formData.aiSuggestedEvidence && formData.aiSuggestedEvidence.length > 0 && (
                <div className="bg-indigo-600 p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10">
                  <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Sparkles size={150} /></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl"><Sparkles size={20} /></div>
                      <h3 className="text-lg font-black uppercase tracking-tighter">AI Case Builder Active</h3>
                    </div>
                    <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                      Incident detected as <span className="text-white font-black">BNS SECTION {formData.bnsSection}</span>. <br/>Ensure the following evidence nodes are uploaded:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {formData.aiSuggestedEvidence.map((doc: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl border border-white/10">
                          <CheckCircle size={14} className="text-indigo-200" />
                          <span className="text-[10px] font-black uppercase tracking-tight">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS FORM */}
              <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 lg:p-12 space-y-10">
                <div className="flex items-center gap-4 border-b border-white/5 pb-8">
                  <div className="p-3 bg-white/5 text-indigo-400 rounded-2xl border border-white/10"><Info size={24} /></div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Statutory Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Incident Title</label>
                    <input name="title" value={formData.title} onChange={handleChange} required className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" placeholder="e.g. UNAUTHORIZED DATA ACCESS" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Node Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest cursor-pointer appearance-none">
                      <option value="civil">CIVIL DISPUTE</option>
                      <option value="criminal">CRIMINAL OFFENCE</option>
                      <option value="cyber">CYBER CRIME NODE</option>
                      <option value="corporate">CORPORATE LITIGATION</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Statute ID (BNS Section)</label>
                    <div className="relative">
                      <BookOpen size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                      <input name="bnsSection" value={formData.bnsSection} onChange={handleChange} className="w-full pl-14 pr-8 py-5 bg-indigo-500/10 border border-indigo-500/20 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest text-indigo-400" placeholder="e.g. 318" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Geo-Location</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input name="location" value={formData.location} onChange={handleChange} required className="w-full pl-14 pr-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" placeholder="e.g. MG ROAD, BANGALORE" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Timestamp of Incident</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input type="date" name="incidentDate" value={formData.incidentDate} onChange={handleChange} required className="w-full pl-14 pr-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-black text-xs uppercase tracking-widest" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-2">Statement of Record</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required rows={8} className="w-full p-8 bg-white/5 border border-white/10 rounded-[2rem] focus:bg-white focus:text-slate-950 transition-all outline-none font-medium text-sm leading-relaxed" placeholder="Detailed factual description..." />
                </div>
              </div>

              {/* EVIDENCE UPLOAD */}
              <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 p-8 lg:p-12 space-y-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20"><UploadCloud size={24} /></div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Vault Ingestion</h3>
                </div>
                
                <div className="p-12 border-4 border-dashed border-white/5 rounded-[2.5rem] text-center group/upload hover:border-emerald-500/30 transition-all cursor-pointer relative">
                  <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <UploadCloud size={48} className="mx-auto text-slate-700 mb-6 group-hover/upload:text-emerald-500 transition-colors" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Drop files or click to secure evidence nodes</p>
                  {selectedFiles.length > 0 && (
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedFiles.map((f, i) => (
                        <div key={i} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                           <FileText size={16} className="text-emerald-500" />
                           <span className="text-[10px] font-black text-emerald-400 uppercase truncate">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* OPTIONS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'isAnonymous', label: 'Stealth Filing', desc: 'Identity encryption active. Only IO can decrypt.', icon: EyeOff, color: 'indigo' },
                  { id: 'shareWithLegalAid', label: 'Pro Bono Signal', desc: 'Request representation from state-aid legal nodes.', icon: Gavel, color: 'purple' }
                ].map(opt => (
                  <label key={opt.id} className="relative flex items-start p-8 bg-white/5 border border-white/10 rounded-[2.5rem] hover:bg-white/10 cursor-pointer transition-all group/opt">
                    <div className="flex items-center h-6 mt-1">
                      <input name={opt.id} type="checkbox" onChange={(e) => {
                        handleChange(e);
                        if(opt.id === 'shareWithLegalAid') setFormData(prev => ({ ...prev, isProBono: e.target.checked }));
                      }} className="w-5 h-5 bg-black/40 border-white/10 rounded focus:ring-indigo-500" />
                    </div>
                    <div className="ml-6">
                      <span className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-3">
                        <opt.icon size={18} className="text-slate-500 group-hover/opt:text-indigo-400 transition-colors"/> {opt.label}
                      </span>
                      <p className="text-slate-500 text-[10px] font-bold uppercase mt-2 leading-relaxed">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button disabled={loading} className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-white/10 hover:bg-indigo-500 hover:text-white transition-all transform hover:scale-[1.01] flex items-center justify-center gap-4">
                {loading ? <Activity className="animate-spin" /> : <Gavel size={20} />}
                {loading ? "COMMITTING TO NODES..." : "SUBMIT OFFICIAL COMPLAINT"}
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};