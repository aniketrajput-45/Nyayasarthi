import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Gavel, Clock, TrendingUp, Calendar, 
  FileText, Bell, Plus, Search, Heart, X, CheckCircle
} from 'lucide-react';

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  category: string;
  location: string;
  isProBono: boolean;
  assignedLawyer?: string;
  createdAt: string;
  status: string;
  hearings?: any[];
}

interface Hearing {
  _id?: string;
  date: string;
  title: string;
  location: string;
  caseId: string;
  caseTitle: string;
}

export const LawyerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [proBonoCases, setProBonoCases] = useState<Case[]>([]);
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [hearingForm, setHearingForm] = useState({ caseId: '', title: '', date: '', location: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const allCases: Case[] = await res.json();
          
          // 1. Pro Bono Logic (Unassigned & Pro Bono)
          setProBonoCases(allCases.filter(c => c.isProBono && !c.assignedLawyer));
          
          // 2. Active Cases Logic (Assigned to Me)
          const myCases = allCases.filter(c => c.assignedLawyer === user?.userId && c.status !== 'resolved');
          setActiveCases(myCases);

          // 3. Extract Hearings
          const hearings: Hearing[] = [];
          myCases.forEach(c => {
            if (c.hearings) {
              c.hearings.forEach((h: any) => {
                hearings.push({
                  ...h,
                  caseId: c._id,
                  caseTitle: c.title,
                  date: h.date 
                });
              });
            }
          });

          const sorted = hearings
            .filter(h => new Date(h.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);

          setUpcomingHearings(sorted);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/cases/${hearingForm.caseId}/hearings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: hearingForm.title,
          date: hearingForm.date,
          location: hearingForm.location
        })
      });
      alert("Hearing Scheduled!");
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center text-slate-500">Loading Command Center...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen relative">
      {/* HEADER SECTION */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, Adv. {user?.fullName?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-4">
          <button className="p-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 relative">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm">
            {user?.fullName?.charAt(0)}
          </div>
        </div>
      </header>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Active Cases', value: activeCases.length, icon: Briefcase, color: 'bg-blue-500' },
          { label: 'Pending Hearings', value: upcomingHearings.length, icon: Gavel, color: 'bg-orange-500' },
          { label: 'Hours Billed', value: '12.5', icon: Clock, color: 'bg-emerald-500' }, 
          { label: 'Success Rate', value: '92%', icon: TrendingUp, color: 'bg-purple-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-xl flex items-center justify-center ${stat.color.replace('bg-', 'text-')}`}>
              <stat.icon size={24} className="text-current" />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: UPCOMING SCHEDULE */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-orange-500" /> Upcoming Schedule
              </h3>
            </div>
            
            <div className="space-y-4">
              {upcomingHearings.length === 0 ? (
                 <p className="text-sm text-slate-400 italic py-4">No upcoming hearings.</p>
               ) : (
                 upcomingHearings.map((h, i) => (
                  <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                    <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-100"></div>
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex-shrink-0 flex items-center justify-center text-orange-600 text-xs font-bold border border-orange-100">
                      {new Date(h.date).getDate()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{h.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {h.location}
                      </p>
                      <p className="text-[10px] text-blue-500 font-medium mt-0.5">Ref: {h.caseTitle}</p>
                    </div>
                  </div>
                 ))
               )}
            </div>

            <button 
              onClick={() => setIsScheduleOpen(true)}
              className="w-full mt-6 py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Add Event
            </button>
          </div>
        </div>

        {/* MIDDLE & RIGHT COLUMN: MY CASELOAD */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase size={20} className="text-blue-500" /> Active Caseload
                </h3>
                <p className="text-sm text-slate-500 mt-1">Review drafts and manage court proceedings</p>
              </div>
            </div>

            {activeCases.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500">You have no active cases.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeCases.map((c) => (
                  <div key={c._id} className="p-5 rounded-xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        {/* STATUS BADGES */}
                        <div className="flex gap-2 mb-2">
                           {c.status === 'pending_lawyer' ? (
                             <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider rounded">
                               ⚠ Draft Review
                             </span>
                           ) : (
                             <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded">
                               <CheckCircle size={10} className="inline mr-1"/> Filed in Court
                             </span>
                           )}
                           
                           {c.isProBono && (
                             <span className="inline-block px-2 py-1 bg-pink-50 text-pink-700 text-[10px] font-bold uppercase tracking-wider rounded">
                               Pro Bono
                             </span>
                           )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-lg">{c.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Gavel size={14} /> {c.category || c.caseNumber}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> Created: {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* ACTION BUTTONS */}
                      <div className="flex flex-col gap-2">
                         <button 
                           onClick={() => navigate(`/case/${c._id}`)}
                           className="bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                         >
                           View Details
                         </button>
                         
                         {/* --- THE GATEKEEPER BUTTON --- */}
                         {c.status === 'pending_lawyer' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if(confirm("Confirm: Submit this case to the Judge?\n\nThis will officially start the legal timer (BNSS).")) {
                                   const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${c._id}/submit-to-court`, {
                                     method: 'PUT',
                                     headers: { Authorization: `Bearer ${token}` }
                                   });
                                   if(res.ok) {
                                     alert("Case forwarded to Judge successfully!");
                                     window.location.reload();
                                   }
                                }
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 animate-pulse"
                            >
                              <Gavel size={14} /> Submit to Court
                            </button>
                         )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* SCHEDULE MODAL */}
      {isScheduleOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Schedule Hearing</h3>
              <button onClick={() => setIsScheduleOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Select Case</label>
                <select 
                  className="w-full p-2 border rounded"
                  onChange={e => setHearingForm({...hearingForm, caseId: e.target.value})}
                  required
                >
                  <option value="">Choose a case...</option>
                  {activeCases.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Hearing Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bail Hearing" 
                  className="w-full p-2 border rounded"
                  onChange={e => setHearingForm({...hearingForm, title: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-2 border rounded"
                  onChange={e => setHearingForm({...hearingForm, date: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Court / Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. High Court Room 4" 
                  className="w-full p-2 border rounded"
                  onChange={e => setHearingForm({...hearingForm, location: e.target.value})}
                  required 
                />
              </div>
              <button className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Confirm Schedule</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};