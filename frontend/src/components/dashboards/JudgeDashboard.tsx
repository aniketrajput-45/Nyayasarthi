import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Gavel, AlertCircle, CheckCircle, Clock, 
  ArrowRight, Shield, Briefcase 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssignModal } from '../AssignModal'; 

// Updated Interface to handle populated objects
interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  status: string;
  type: string;
  deadlineDate: string;
  // Lawyer is an object because it is populated by the backend
  assignedLawyer?: { 
    _id: string; 
    fullName: string; 
  };
  assignedPolice?: { 
    _id: string; 
    fullName: string; 
  };
}

export const JudgeDashboard: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, unassigned: 0 });
  const [unassignedCases, setUnassignedCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  // We store the whole case object now to pass the lawyer's name to the modal
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const allCases: Case[] = await res.json();
          
          // FILTER CHANGE: Judge only cares if Police is missing. 
          // (Lawyer is assumed to be present as they filed the case)
          const leftovers = allCases.filter(c => !c.assignedPolice && c.status !== 'resolved');
          
          setStats({
            total: allCases.length,
            pending: allCases.filter(c => c.status !== 'resolved').length,
            unassigned: leftovers.length
          });
          
          setUnassignedCases(leftovers);
        }
      } catch (error) {
        console.error("Error loading judge data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // --- TIMER LOGIC ---
  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return { color: 'bg-gray-100 text-gray-700', text: 'NO DEADLINE', icon: Clock };
    
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (daysLeft < 0) return { color: 'bg-red-100 text-red-700 border border-red-200', text: `${Math.abs(daysLeft)} DAYS OVERDUE`, icon: AlertCircle };
    if (daysLeft < 15) return { color: 'bg-orange-100 text-orange-700 border border-orange-200', text: `${daysLeft} Days Left`, icon: Clock };
    return { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', text: `${daysLeft} Days Remaining`, icon: CheckCircle };
  };

  const handleAssignSuccess = () => {
    setAssignModalOpen(false);
    window.location.reload(); // Refresh to remove the assigned case from the list
  };

  if (loading) return <div className="p-8">Loading Judicial Overview...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Gavel className="text-slate-700" size={32} /> Judicial Dashboard
        </h1>
        <p className="text-slate-500 mt-1">Review pending cases and assign investigating officers.</p>
      </header>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Assignment</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.unassigned}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Clock size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Active Trials</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.pending}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Caseload</p>
              <h3 className="text-3xl font-bold text-slate-900">{stats.total}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* "ACTION REQUIRED" TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-red-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-red-900 text-lg">Action Required</h3>
            <p className="text-red-700 text-sm">Cases requiring a Police Officer assignment.</p>
          </div>
        </div>

        {unassignedCases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
            <p>All active cases have investigating officers assigned.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Case Info</th>
                <th className="px-6 py-3">Statutory Deadline (BNSS)</th>
                <th className="px-6 py-3">Present Lawyer</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unassignedCases.map((c) => {
                const timer = getTimerStatus(c.deadlineDate);
                const TimerIcon = timer.icon;

                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.caseNumber}</p>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block capitalize">{c.type}</span>
                    </td>
                    
                    {/* TIMER */}
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${timer.color}`}>
                        <TimerIcon size={16} className={timer.text.includes('OVERDUE') ? 'animate-pulse' : ''} />
                        <span className="text-xs font-bold uppercase tracking-wide">{timer.text}</span>
                      </div>
                    </td>

                    {/* LAWYER STATUS */}
                    <td className="px-6 py-4">
                       {c.assignedLawyer ? (
                         <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                             {c.assignedLawyer.fullName.charAt(0)}
                           </div>
                           <span className="text-sm text-slate-700 font-medium">Adv. {c.assignedLawyer.fullName.split(' ')[0]}</span>
                         </div>
                       ) : (
                         <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">Pending Lawyer</span>
                       )}
                    </td>

                    {/* ASSIGN BUTTON */}
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedCase(c);
                          setAssignModalOpen(true);
                        }}
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm flex items-center gap-2 ml-auto"
                      >
                        <Shield size={14} /> Assign Police
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="mt-6 text-center">
        <button onClick={() => navigate('/cases')} className="text-slate-600 hover:text-slate-900 font-medium flex items-center justify-center gap-2 mx-auto">
          View All Case History <ArrowRight size={16} />
        </button>
      </div>

      {/* UPDATE: Passing currentLawyer to the Modal */}
      <AssignModal 
        isOpen={assignModalOpen} 
        onClose={() => setAssignModalOpen(false)}
        caseId={selectedCase?._id || ""}
        onAssign={handleAssignSuccess}
        currentLawyer={selectedCase?.assignedLawyer?.fullName} 
      />
    </div>
  );
};