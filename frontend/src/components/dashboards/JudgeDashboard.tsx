import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Gavel, AlertCircle, CheckCircle, Clock, 
  ArrowRight, Shield, Briefcase, FileText, Lock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AssignModal } from '../AssignModal'; 
import { Notifications } from '../Notifications'; // Don't forget the bell!

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  status: string;
  type: string;
  deadlineDate: string;
  assignedLawyer?: { _id: string; fullName: string; };
  assignedPolice?: { _id: string; fullName: string; };
}

export const JudgeDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, unassigned: 0 });
  
  // Data Buckets
  const [unassignedCases, setUnassignedCases] = useState<Case[]>([]);
  const [assignedCases, setAssignedCases] = useState<Case[]>([]);    
  
  const [loading, setLoading] = useState(true);

  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const allCases: Case[] = await res.json();
        
        // 1. ACTION REQUIRED (Unassigned & Not Resolved)
        const pending = allCases.filter(c => !c.assignedPolice && c.status !== 'resolved');
        
        // 2. ACTIVE DOCKET (Assigned & Not Resolved)
        const active = allCases.filter(c => c.assignedPolice && c.status !== 'resolved');

        setStats({
          total: allCases.length,
          pending: active.length,
          unassigned: pending.length
        });
        
        setUnassignedCases(pending);
        setAssignedCases(active);
      }
    } catch (error) {
      console.error("Error loading judge data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // --- CLOSE CASE FUNCTION ---
  const handleCloseCase = async (id: string, caseNumber: string) => {
    if (!confirm(`⚖️ ISSUE VERDICT?\n\nAre you sure you want to close Case #${caseNumber}?\n\nThis will:\n1. Mark the case as RESOLVED.\n2. Notify all parties (Citizen, Police, Lawyer).\n3. Archive the case file.`)) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${id}/verdict`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        alert(`Case #${caseNumber} Closed Successfully.`);
        fetchData(); // Refresh the list to remove the closed case
      } else {
        alert("Failed to close case.");
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    fetchData();
  };

  if (loading) return <div className="p-8">Loading Judicial Overview...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Gavel className="text-slate-700" size={32} /> Judicial Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Honorable Judge {user?.fullName}</p>
        </div>
        <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200">
           <Notifications />
        </div>
      </div>

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
              <p className="text-sm font-medium text-slate-500">Active Docket</p>
              <h3 className="text-3xl font-bold text-slate-900">{assignedCases.length}</h3>
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

      {/* SECTION 1: ACTION REQUIRED (UNASSIGNED) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-slate-100 bg-red-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
              <AlertCircle size={20} /> Action Required
            </h3>
            <p className="text-red-700 text-sm">Assign Investigating Officers to these cases immediately.</p>
          </div>
        </div>

        {unassignedCases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
            <p>No pending assignments. You are all caught up!</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Case Info</th>
                <th className="px-6 py-3">Deadline</th>
                <th className="px-6 py-3">Status</th>
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
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${timer.color}`}>
                        <TimerIcon size={16} />
                        <span className="text-xs font-bold uppercase">{timer.text}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded">Needs Police</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/case/${c._id}`)}
                        className="text-slate-500 hover:text-blue-600 font-medium text-sm mr-4 transition-colors"
                      >
                         View Details
                      </button>
                      <button 
                        onClick={() => { setSelectedCase(c); setAssignModalOpen(true); }}
                        className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition shadow-sm inline-flex items-center gap-2"
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

      {/* SECTION 2: MY ACTIVE DOCKET (ASSIGNED / ONGOING) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-blue-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
              <Gavel size={20} /> My Active Docket
            </h3>
            <p className="text-blue-700 text-sm">Cases currently in trial. Issue verdicts here.</p>
          </div>
          <div className="bg-white px-3 py-1 rounded-full text-blue-800 text-xs font-bold border border-blue-100">
            {assignedCases.length} Active
          </div>
        </div>

        {assignedCases.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="italic">No active cases in your docket.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3">Case Info</th>
                <th className="px-6 py-3">Deadline</th>
                <th className="px-6 py-3">Assigned Team</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignedCases.map((c) => {
                const timer = getTimerStatus(c.deadlineDate);
                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{c.title}</p>
                      <p className="text-xs text-slate-500 font-mono">{c.caseNumber}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-xs font-bold px-2 py-1 rounded ${timer.color.split(' ')[0]} ${timer.color.split(' ')[1]}`}>
                         {timer.text}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                          {c.assignedLawyer && (
                             <div className="flex items-center gap-1.5 text-xs text-slate-700">
                               <Briefcase size={12} className="text-slate-400"/> 
                               Adv. {c.assignedLawyer.fullName.split(' ')[0]}
                             </div>
                          )}
                          {c.assignedPolice && (
                             <div className="flex items-center gap-1.5 text-xs text-slate-700">
                               <Shield size={12} className="text-blue-500"/> 
                               Off. {c.assignedPolice.fullName.split(' ')[0]}
                             </div>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                      
                      {/* VIEW BUTTON */}
                      <button 
                        onClick={() => navigate(`/case/${c._id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                      >
                         View Details
                      </button>

                      {/* --- NEW: CLOSE CASE BUTTON --- */}
                      <button 
                        onClick={() => handleCloseCase(c._id, c.caseNumber)}
                        className="bg-green-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-green-700 transition shadow-sm font-bold flex items-center gap-2"
                        title="Close Case & Issue Verdict"
                      >
                         <Lock size={12} /> Issue Verdict
                      </button>
                      
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

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