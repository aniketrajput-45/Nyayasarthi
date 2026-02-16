import React, { useEffect, useState } from 'react';
import { X, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: () => void;
  caseId: string;
  currentLawyer?: string; // Optional: To show who the lawyer is
}

export const AssignModal: React.FC<AssignModalProps> = ({ isOpen, onClose, onAssign, caseId, currentLawyer }) => {
  const { token } = useAuth();
  const [police, setPolice] = useState<User[]>([]);
  const [selectedPolice, setSelectedPolice] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch ONLY Police Officers (Lawyer is already assigned)
  useEffect(() => {
    if (isOpen) {
      const fetchProfessionals = async () => {
        try {
          // Fetch Police
          const resPolice = await fetch(`${import.meta.env.VITE_API_URL}/users?role=police`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resPolice.ok) setPolice(await resPolice.json());
          
        } catch (error) {
          console.error("Error fetching professionals:", error);
        }
      };
      fetchProfessionals();
    }
  }, [isOpen, token]);

  const handleAssign = async () => {
    if (!selectedPolice) return alert("Please select a Police Officer");

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          assignedPolice: selectedPolice,
          // We do NOT send assignedLawyer here, keeping the existing one
        })
      });

      if (res.ok) {
        onAssign(); // Refresh the dashboard
        onClose();  // Close modal
      } else {
        alert("Failed to assign police.");
      }
    } catch (error) {
      console.error(error);
      alert("Error assigning police.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Shield className="text-blue-600" size={20} /> Assign Investigation
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Read-Only: Current Lawyer */}
          {currentLawyer && (
             <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
               <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Assigned Lawyer</span>
               <div className="text-sm font-semibold text-slate-700 mt-1">{currentLawyer}</div>
             </div>
          )}

          {/* Select Police */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Investigating Officer</label>
            <select 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={selectedPolice}
              onChange={(e) => setSelectedPolice(e.target.value)}
            >
              <option value="">-- Choose Officer --</option>
              {police.map(p => (
                <option key={p._id} value={p._id}>
                  {p.fullName} ({p.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-2">
              This officer will receive the case details and begin the investigation.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleAssign}
            disabled={loading || !selectedPolice}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
            <UserCheck size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};