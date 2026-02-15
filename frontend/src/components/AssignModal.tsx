import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { X, Shield, Briefcase } from 'lucide-react';

interface User {
  _id: string;
  fullName: string;
  email: string;
}

interface AssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseId: string;
  onSuccess: () => void;
}

export const AssignModal: React.FC<AssignModalProps> = ({ isOpen, onClose, caseId, onSuccess }) => {
  const { token } = useAuth();
  const [police, setPolice] = useState<User[]>([]);
  const [lawyers, setLawyers] = useState<User[]>([]);
  const [selectedPolice, setSelectedPolice] = useState('');
  const [selectedLawyer, setSelectedLawyer] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch available Police
      fetch(`${import.meta.env.VITE_API_URL}/users?role=police`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setPolice(data))
      .catch(err => console.error(err));

      // Fetch available Lawyers
      fetch(`${import.meta.env.VITE_API_URL}/users?role=lawyer`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setLawyers(data))
      .catch(err => console.error(err));
    }
  }, [isOpen, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          assignedLawyer: selectedLawyer
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to assign.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative shadow-xl animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-slate-800 mb-6">Assign Professionals</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Shield size={16} className="text-blue-600" /> Assign Police
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedPolice}
              onChange={e => setSelectedPolice(e.target.value)}
              required
            >
              <option value="">Choose Officer...</option>
              {police.map(p => <option key={p._id} value={p._id}>{p.fullName} ({p.email})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
              <Briefcase size={16} className="text-orange-600" /> Assign Lawyer
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={selectedLawyer}
              onChange={e => setSelectedLawyer(e.target.value)}
              required
            >
              <option value="">Choose Lawyer...</option>
              {lawyers.map(l => <option key={l._id} value={l._id}>{l.fullName} ({l.email})</option>)}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors mt-2"
          >
            {loading ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
};