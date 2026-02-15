import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Activity, CheckCircle, Clock, 
  AlertTriangle, EyeOff, ChevronRight, Shield, AlertCircle 
} from 'lucide-react';

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  isAnonymous: boolean;
  createdAt: string;
  deadlineDate: string; // Ensure this is here
}

export const CitizenDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setCases(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [token]);

  // --- TIMER LOGIC (Reuse from Judge Dashboard) ---
  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return null; // Don't show if no deadline (old cases)
    
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (daysLeft < 0) return { color: 'bg-red-100 text-red-700 border-red-200', text: `${Math.abs(daysLeft)} DAYS OVERDUE`, icon: AlertCircle };
    if (daysLeft < 15) return { color: 'bg-orange-100 text-orange-700 border-orange-200', text: `${daysLeft} Days Left`, icon: Clock };
    return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', text: `${daysLeft} Days to Resolution`, icon: CheckCircle };
  };

  // Helper to determine active step (0 to 3)
  const getStep = (status: string) => {
    switch(status) {
      case 'filed': return 0;
      case 'under-investigation': return 1;
      case 'in-court': return 2;
      case 'resolved': return 3;
      default: return 0;
    }
  };

  const handleSOS = () => {
    if(confirm("⚠️ SEND EMERGENCY ALERT? \n\nThis will instantly notify the nearest Police Control Room with your GPS location.")) {
      alert("SOS SIGNAL SENT! \nPolice are tracking your location. Stay safe.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading your dashboard...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="max-w-5xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome, {user?.fullName}</h1>
          <p className="text-slate-500">Track your legal cases and statutory deadlines.</p>
        </div>
        
        <button 
          onClick={handleSOS}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-red-500/30 flex items-center gap-2 animate-pulse transition-transform active:scale-95"
        >
          <AlertTriangle size={24} /> SOS EMERGENCY
        </button>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* STATS (Simplified) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Total Cases</p>
              <h3 className="text-2xl font-bold text-slate-900">{cases.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Activity size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">Active</p>
              <h3 className="text-2xl font-bold text-slate-900">{cases.filter(c => c.status !== 'resolved').length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition" onClick={() => navigate('/file-case')}>
            <div className="p-3 bg-slate-900 text-white rounded-lg"><Shield size={24} /></div>
            <div>
              <p className="text-slate-500 text-sm font-medium">New Complaint</p>
              <h3 className="text-lg font-bold text-slate-900">File Now &rarr;</h3>
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-8">
          <Activity className="text-blue-600" /> Case Tracking
        </h2>

        {cases.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No active cases found</h3>
            <p className="text-slate-500 mt-2 mb-6">File a complaint to start tracking its progress.</p>
            <button onClick={() => navigate('/file-case')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">File New Case</button>
          </div>
        ) : (
          cases.map((caseItem) => {
            const currentStep = getStep(caseItem.status);
            const timer = getTimerStatus(caseItem.deadlineDate); // Get Timer Data
            const steps = [
              { label: 'Filed', icon: FileText },
              { label: 'Investigation', icon: Shield },
              { label: 'Hearing', icon: Clock },
              { label: 'Verdict', icon: CheckCircle }
            ];

            return (
              <div key={caseItem._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden">
                
                {/* Visual Deadline Badge (Top Right) */}
                {timer && (
                  <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-xs font-bold uppercase tracking-wider border-b border-l flex items-center gap-2 ${timer.color}`}>
                    <timer.icon size={14} className={timer.text.includes('OVERDUE') ? 'animate-pulse' : ''} />
                    {timer.text}
                  </div>
                )}

                {/* Case Header */}
                <div className="flex justify-between items-start mb-6 mt-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-900">{caseItem.title}</h3>
                      {caseItem.isAnonymous && (
                        <span className="bg-slate-800 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1">
                          <EyeOff size={10} /> Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-mono">Case #{caseItem.caseNumber} • {new Date(caseItem.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  {/* View Details Button */}
                  <button 
                    onClick={() => navigate(`/case/${caseItem._id}`)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 mt-6 md:mt-0"
                  >
                    View Details <ChevronRight size={16} />
                  </button>
                </div>

                {/* Visual Tracker */}
                <div className="relative mt-4">
                  <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded"></div>
                  <div 
                    className="absolute top-4 left-0 h-1 bg-blue-600 rounded transition-all duration-1000"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                  ></div>

                  <div className="relative flex justify-between">
                    {steps.map((step, index) => {
                      const isActive = index <= currentStep;
                      return (
                        <div key={step.label} className="flex flex-col items-center">
                          <div 
                            className={`
                              w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10
                              ${isActive ? 'bg-white border-blue-600 text-blue-600 shadow-sm scale-110' : 'bg-slate-50 border-slate-200 text-slate-300'}
                            `}
                          >
                            <step.icon size={16} strokeWidth={2.5} />
                          </div>
                          <span className={`text-xs font-semibold mt-2 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};