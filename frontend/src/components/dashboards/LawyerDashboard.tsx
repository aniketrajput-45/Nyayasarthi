import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Gavel, Clock, TrendingUp, Calendar, 
  FileText, Bell, ChevronRight, Plus, Search, Heart 
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
}

export const LawyerDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [proBonoCases, setProBonoCases] = useState<Case[]>([]);
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const allCases: Case[] = await res.json();
          // Filter Pro Bono (Unassigned)
          setProBonoCases(allCases.filter(c => c.isProBono && !c.assignedLawyer));
          // Filter My Active Cases
          setActiveCases(allCases.filter(c => c.assignedLawyer === user?.userId && c.status !== 'resolved'));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, user]);

  // Mock Hearing Data (In a real app, this comes from the backend)
  const hearings = [
    { id: 1, title: 'Bail Hearing: Sharma vs State', time: '10:00 AM', court: 'High Court, Room 4' },
    { id: 2, title: 'Evidence Submission: Property Dispute', time: '02:30 PM', court: 'District Court' },
    { id: 3, title: 'Client Meeting: Corporate Fraud', time: '04:00 PM', court: 'Office' },
  ];

  if (loading) return <div className="p-8 flex items-center justify-center text-slate-500">Loading Command Center...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
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
          { label: 'Pending Hearings', value: '3', icon: Gavel, color: 'bg-orange-500' },
          { label: 'Hours Billed', value: '12.5', icon: Clock, color: 'bg-emerald-500' }, // Mock Data
          { label: 'Success Rate', value: '92%', icon: TrendingUp, color: 'bg-purple-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${stat.color} bg-opacity-10 rounded-xl flex items-center justify-center text-white ${stat.color.replace('bg-', 'text-')}`}>
              <stat.icon size={24} className={stat.color === 'bg-blue-500' ? 'text-blue-600' : 'text-white'} /> 
              {/* Fix icon color logic simply */}
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
        
        {/* LEFT COLUMN: UPCOMING SCHEDULE (New Feature) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={20} className="text-orange-500" /> Today's Schedule
              </h3>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">View Calendar</button>
            </div>
            
            <div className="space-y-4">
              {hearings.map((h, i) => (
                <div key={h.id} className="flex gap-4 items-start relative pb-4 last:pb-0">
                  {/* Timeline Line */}
                  {i !== hearings.length - 1 && (
                    <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-100"></div>
                  )}
                  
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex-shrink-0 flex items-center justify-center text-orange-600 text-xs font-bold border border-orange-100">
                    {h.time.split(':')[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{h.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {h.time} • {h.court}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-2.5 border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm font-medium hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2">
              <Plus size={16} /> Add Event
            </button>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Quick Actions</h3>
              <p className="text-indigo-200 text-sm mb-4">Manage your legal workflow</p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate('/file-case')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-lg text-left transition-colors"
                >
                  <FileText size={20} className="mb-2 text-indigo-300" />
                  <span className="text-sm font-medium">Draft Notice</span>
                </button>
                <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-lg text-left transition-colors">
                  <Search size={20} className="mb-2 text-indigo-300" />
                  <span className="text-sm font-medium">Research</span>
                </button>
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>

        {/* MIDDLE & RIGHT COLUMN: PRO BONO BOARD (Enhanced) */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Heart size={20} className="text-pink-500" /> Pro Bono Opportunities
                </h3>
                <p className="text-sm text-slate-500 mt-1">Recommended cases based on your expertise</p>
              </div>
              <button 
                onClick={() => navigate('/cases')}
                className="bg-slate-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                View All Cases
              </button>
            </div>

            {proBonoCases.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-500">No new opportunities available right now.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {proBonoCases.slice(0, 3).map((c) => (
                  <div key={c._id} className="group p-5 rounded-xl border border-slate-200 hover:border-pink-200 hover:shadow-md hover:shadow-pink-500/5 transition-all bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-500"></div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2 py-1 bg-pink-50 text-pink-700 text-[10px] font-bold uppercase tracking-wider rounded mb-2">
                          Legal Aid
                        </span>
                        <h4 className="font-bold text-slate-900 text-lg">{c.title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Gavel size={14} /> {c.category || 'General'}</span>
                          <span className="flex items-center gap-1"><Clock size={14} /> Filed: {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/case/${c._id}`)}
                        className="bg-slate-50 text-slate-600 p-2 rounded-lg group-hover:bg-pink-50 group-hover:text-pink-600 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Promotional Banner */}
            <div className="mt-6 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold text-lg">Boost your firm's reputation</h4>
                <p className="text-blue-100 text-sm mt-1 max-w-md">Accepting Pro Bono cases increases your visibility and contributes to your firm's social responsibility score.</p>
              </div>
              <TrendingUp size={80} className="absolute -right-4 -bottom-8 text-white opacity-20" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};