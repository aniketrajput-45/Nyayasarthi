import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, Search, FileText, AlertTriangle, CheckCircle, 
  MapPin, Clock, MessageSquare, Plus, Upload, BookOpen 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Note {
  _id: string;
  note: string;
  addedAt: string;
}

interface Document {
  _id: string;
  fileName: string;
  fileUrl: string;
}

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  status: string;
  type: string;
  location: string;
  description: string;
  incidentDate: string;
  investigationNotes: Note[];
  documents: Document[];
  assignedPolice?: string;
  filedBy: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export const PoliceDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Investigation Mode State
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- HELPER: Fetch My Cases ---
  const fetchCases = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const allCases: Case[] = await res.json();
        // Filter: Only cases assigned to ME (User ID check handled by backend usually, but double check here)
        // AND exclude resolved/in-court cases if you only want active investigations
        const myCases = allCases.filter(c => 
          c.assignedPolice && 
          (typeof c.assignedPolice === 'string' ? c.assignedPolice === user?.userId : c.assignedPolice._id === user?.userId) &&
          c.status === 'under-investigation'
        );
        setActiveCases(myCases);
      }
    } catch (error) {
      console.error("Error fetching police cases", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [token, user]);

  // --- ACTION: Add Case Diary Note ---
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNote.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${selectedCase._id}/investigation-notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ note: newNote })
      });

      if (res.ok) {
        const updatedCase = await res.json();
        // Update local state to show new note immediately
        setSelectedCase(updatedCase);
        setNewNote('');
        fetchCases(); // Refresh list in background
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- ACTION: File Charge Sheet ---
  const handleFileChargeSheet = async () => {
    if (!selectedCase) return;
    if (!confirm("CONFIRM: File Charge Sheet?\n\nThis will mark the investigation as COMPLETE and forward the case to the Judge for trial.")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${selectedCase._id}/charge-sheet`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert("Charge Sheet Filed Successfully!");
        setSelectedCase(null); // Close modal
        fetchCases(); // Refresh list (case will disappear as it's no longer 'under-investigation')
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Station Data...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-blue-600" size={32} /> Police Station Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Active Investigations & Case Diary</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
           <span className="text-xs font-bold text-slate-500 uppercase">Active Cases</span>
           <div className="text-2xl font-bold text-blue-600">{activeCases.length}</div>
        </div>
      </div>

      {/* ACTIVE CASES GRID */}
      {activeCases.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-slate-800">No Active Investigations</h3>
          <p className="text-slate-500">You are all caught up! Wait for new assignments from the Judge.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeCases.map(c => (
            <div key={c._id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{c.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                       {c.caseNumber}
                     </span>
                     <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase">
                       {c.type}
                     </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCase(c)}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Manage Investigation
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="mt-0.5 text-slate-400" />
                  <span>{c.location} (Incident: {new Date(c.incidentDate).toLocaleDateString()})</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-600">
                   <FileText size={16} className="mt-0.5 text-slate-400" />
                   <p className="line-clamp-2">{c.description}</p>
                </div>
                <div className="pt-3 flex gap-2">
                   <button 
                     onClick={() => navigate('/chat')}
                     className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                   >
                     <MessageSquare size={16} /> Contact Citizen
                   </button>
                   <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
                     <FileText size={16} /> View FIR
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- INVESTIGATION MODAL (The "Case Diary") --- */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-slate-200 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Investigation Details</h2>
                <p className="text-slate-500 text-sm">{selectedCase.caseNumber}</p>
              </div>
              <button onClick={() => setSelectedCase(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                Close
              </button>
            </div>

            <div className="p-6 space-y-8">
              
              {/* 1. STATUS & ACTIONS */}
              <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                 <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    <Shield size={18} /> Current Status: Under Investigation
                 </h3>
                 <p className="text-sm text-blue-700 mb-4">
                    Complete your inquiries and upload evidence. When ready, file the Charge Sheet to proceed to trial.
                 </p>
                 <button 
                   onClick={handleFileChargeSheet}
                   className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
                 >
                    <BookOpen size={18} /> FILE CHARGE SHEET (Submit to Court)
                 </button>
              </div>

              {/* 2. DIGITAL CASE DIARY */}
              <div>
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <BookOpen size={20} className="text-slate-400" /> Case Diary Logs
                 </h3>
                 
                 {/* Add Note Input */}
                 <form onSubmit={handleAddNote} className="mb-6">
                    <textarea 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter investigation update (e.g., 'Visited crime scene', 'Collected CCTV footage')..."
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                    />
                    <div className="flex justify-end mt-2">
                       <button 
                         disabled={isSubmitting || !newNote.trim()}
                         className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 disabled:opacity-50"
                       >
                         {isSubmitting ? 'Logging...' : 'Add Log Entry'}
                       </button>
                    </div>
                 </form>

                 {/* Timeline */}
                 <div className="space-y-4">
                    {selectedCase.investigationNotes && selectedCase.investigationNotes.length > 0 ? (
                       [...selectedCase.investigationNotes].reverse().map((note) => (
                         <div key={note._id} className="flex gap-4">
                            <div className="flex flex-col items-center">
                               <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                               <div className="w-0.5 bg-slate-100 flex-1 h-full"></div>
                            </div>
                            <div className="pb-4">
                               <p className="text-xs text-slate-400 font-mono mb-1">
                                  {new Date(note.addedAt).toLocaleString()}
                               </p>
                               <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-700">
                                  {note.note}
                               </div>
                            </div>
                         </div>
                       ))
                    ) : (
                       <p className="text-center text-slate-400 text-sm italic py-4">No entries in Case Diary yet.</p>
                    )}
                 </div>
              </div>

              {/* 3. EVIDENCE LOCKER */}
              <div>
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Upload size={20} className="text-slate-400" /> Evidence Locker
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-slate-500">
                       <Plus size={24} className="mb-2" />
                       <span className="text-sm font-medium">Upload Evidence</span>
                    </button>
                    {selectedCase.documents.map((doc, idx) => (
                       <div key={idx} className="p-4 border border-slate-200 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                             <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-sm font-bold text-slate-800 truncate">{doc.fileName}</p>
                             <a href={doc.fileUrl} target="_blank" className="text-xs text-blue-600 hover:underline">View File</a>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};