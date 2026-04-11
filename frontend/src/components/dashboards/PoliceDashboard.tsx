import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, CheckCircle, MessageSquare, BookOpen, 
  Users, AlertTriangle, FileText, Clock, TrendingUp, MapPin, 
  ChevronDown, ChevronUp, Zap, Sparkles, Map, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Notifications } from '../Notifications'; 

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  status: string;
  type: string;
  location: string;
  description: string;
  incidentDate: string;
  deadlineDate: string; // Added Deadline
  assignedPolice?: any; 
  filedBy: { fullName: string; email: string };
}

export const PoliceDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [stationCases, setStationCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'map'>('queue');

  // Stats
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    myActive: 0,
    stationTotal: 0,
    unassigned: 0
  });

  // --- AI PRIORITIZATION LOGIC ---
  const prioritizeCases = (cases: Case[]) => {
    return [...cases].sort((a, b) => {
      // 1. Severity Score (Criminal > Cyber > Civil)
      const severity: Record<string, number> = { criminal: 3, cyber: 2, civil: 1, corporate: 1 };
      const scoreA = severity[a.type] || 0;
      const scoreB = severity[b.type] || 0;
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      // 2. Deadline Urgency (Closer deadline = higher priority)
      const dateA = new Date(a.deadlineDate).getTime();
      const dateB = new Date(b.deadlineDate).getTime();
      return dateA - dateB;
    });
  };

  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return { color: 'bg-gray-100 text-gray-700', text: 'NO DEADLINE', icon: Clock };
    
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (daysLeft < 0) return { color: 'bg-red-100 text-red-700 border border-red-200', text: `${Math.abs(daysLeft)} DAYS OVERDUE`, icon: AlertTriangle };
    if (daysLeft < 15) return { color: 'bg-orange-100 text-orange-700 border border-orange-200', text: `${daysLeft} Days Left`, icon: Clock };
    return { color: 'bg-emerald-100 text-emerald-700 border border-emerald-200', text: `${daysLeft} Days Left`, icon: Clock };
  };

  const isAssignedToMe = (c: Case) => {
    if (!c.assignedPolice) return false;
    const assignedId = typeof c.assignedPolice === 'string' ? c.assignedPolice : c.assignedPolice._id;
    return assignedId === user?.userId || assignedId === user?._id;
  };

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const allCases: Case[] = await res.json();
          
          const mine = allCases.filter(c => isAssignedToMe(c) && c.status !== 'resolved');
          const unassignedCount = allCases.filter(c => !c.assignedPolice).length;
          const othersCount = allCases.length - mine.length - unassignedCount;

          setMyCases(prioritizeCases(mine));
          setStationCases(allCases.filter(c => !isAssignedToMe(c)));

          setStats({
            myActive: mine.length,
            stationTotal: allCases.length,
            unassigned: unassignedCount
          });

          setChartData([
            { name: 'My Cases', value: mine.length, color: '#2563EB' },      
            { name: 'Unassigned', value: unassignedCount, color: '#F97316' }, 
            { name: 'Other Officers', value: othersCount, color: '#94A3B8' }  
          ]);
        }
      } catch (error) {
        console.error("Error fetching police data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
    const interval = setInterval(fetchCases, 10000); 
    return () => clearInterval(interval);
  }, [token, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-[10px]">Synchronizing Command Center...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      
      {/* 1. PREMIUM HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Command Center</h1>
              <p className="text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em]">Officer {user?.fullName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="bg-slate-100 p-2.5 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer relative group">
               <Notifications />
            </div>
            <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Patrol Live</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-10 pb-24">
        
        {/* 2. ANALYTICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-blue-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-full uppercase">Priority</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.myActive}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Active Investigations</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-orange-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-1 rounded-full uppercase">Pending</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.unassigned}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Unassigned Cases</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col justify-between group hover:border-emerald-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase">Monthly</span>
            </div>
            <div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.stationTotal - stats.unassigned}</h3>
              <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Clearance Rate</p>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl shadow-slate-200 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
               <Sparkles size={120} className="text-white absolute -right-4 -top-4" />
            </div>
            <div className="w-full h-24 z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={25} outerRadius={35} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-white/50 text-[8px] font-black uppercase tracking-[0.2em] mt-2 z-10">Workload Optimization</p>
          </div>
        </div>

        {/* 3. TASK QUEUE & HEATMAP TABS */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-6 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'queue' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Zap size={18} /> AI-Prioritized Task Queue
            </button>
            <button 
              onClick={() => setActiveTab('map')}
              className={`flex-1 py-6 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === 'map' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Map size={18} /> Station Incident Heatmap
            </button>
          </div>

          <div className="p-8 lg:p-10">
            {activeTab === 'queue' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <Sparkles size={20} className="text-blue-600" /> Dispatch Priorities
                    </h3>
                    <p className="text-slate-500 text-xs font-bold uppercase mt-1 tracking-wider">Sorted by severity & legal deadlines</p>
                  </div>
                  <div className="px-4 py-2 bg-blue-50 rounded-xl text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                    Auto-Optimized by AI
                  </div>
                </div>

                {myCases.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                    <Target size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">All clear • No urgent tasks</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {myCases.map((c, idx) => {
                      const timer = getTimerStatus(c.deadlineDate);
                      return (
                        <div key={c._id} className="group bg-slate-50 hover:bg-white rounded-[32px] p-6 border border-transparent hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100 transition-all duration-500">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">{c.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-slate-400 tracking-widest">#{c.caseNumber}</span>
                                  {timer && <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${timer.color}`}>{timer.text}</span>}
                                </div>
                              </div>
                            </div>
                            {idx === 0 && <span className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg animate-pulse">URGENT dispatch</span>}
                          </div>
                          <p className="text-slate-600 text-xs font-medium leading-relaxed mb-6 line-clamp-2 italic">"{c.description}"</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase flex items-center gap-1"><MapPin size={10}/> {c.location}</span>
                              <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase">{c.type}</span>
                            </div>
                            <button onClick={() => navigate(`/case/${c._id}`)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">File Report &rarr;</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'map' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-900 rounded-[32px] p-8 relative overflow-hidden min-h-[500px] border-4 border-slate-800 shadow-2xl">
                   <div className="absolute top-6 left-6 z-10">
                      <h3 className="text-white font-black text-lg flex items-center gap-2">
                        <Map size={20} className="text-blue-400" /> Jurisdiction Overlay
                      </h3>
                      <p className="text-blue-400/60 text-[10px] font-bold uppercase tracking-[0.2em]">Real-time telemetry active</p>
                   </div>

                   {/* Map Grid Simulation */}
                   <div className="grid grid-cols-10 grid-rows-8 gap-1 opacity-10 absolute inset-0 p-4">
                     {Array.from({ length: 80 }).map((_, i) => (
                       <div key={i} className="aspect-square border border-slate-700 border-dashed" />
                     ))}
                   </div>

                   {/* Heatmap Blobs */}
                   <div className="absolute inset-0 p-12">
                      <div className="relative w-full h-full">
                         <div className="absolute top-[20%] left-[30%] w-40 h-40 bg-red-500/20 rounded-full blur-[80px] animate-pulse" />
                         <div className="absolute top-[28%] left-[38%] p-3 bg-red-600 text-white rounded-2xl shadow-2xl shadow-red-900/50 border border-red-400 animate-bounce">
                            <AlertTriangle size={20} />
                         </div>
                         <div className="absolute top-[38%] left-[38%] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                            <p className="text-white text-[10px] font-black uppercase">MG Road Hotspot</p>
                            <p className="text-red-400 text-[8px] font-bold uppercase">6 High-Priority Matched</p>
                         </div>

                         <div className="absolute bottom-[20%] right-[20%] w-48 h-48 bg-blue-500/10 rounded-full blur-[100px]" />
                         <div className="absolute bottom-[25%] right-[25%] p-3 bg-blue-600 text-white rounded-2xl shadow-2xl border border-blue-400">
                            <Shield size={20} />
                         </div>

                         <div className="absolute top-[10%] left-[80%] flex flex-col items-center">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,1)] animate-ping" />
                            <p className="text-[8px] font-black text-emerald-400 mt-2 uppercase tracking-widest">Patrol A-14</p>
                         </div>
                      </div>
                   </div>

                   <div className="absolute bottom-8 right-8 bg-slate-800/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl">
                      <p className="text-white font-black text-xs uppercase tracking-widest mb-4">Unit Deployment</p>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between gap-12">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Active Units</span>
                            <span className="text-sm font-black text-blue-400">12</span>
                         </div>
                         <div className="flex items-center justify-between gap-12">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Response</span>
                            <span className="text-sm font-black text-red-400">4.2m</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. STATION REGISTRY */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
            Station Registry
          </h2>
          <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Investigation Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Statutory Deadline</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Team</th>
                  <th className="px-8 py-6 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stationCases.map(c => {
                  const timer = getTimerStatus(c.deadlineDate);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-black text-slate-900 text-sm uppercase tracking-tight">{c.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Ref: {c.caseNumber}</div>
                      </td>
                      <td className="px-8 py-6">
                         {timer && (
                           <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${timer.color.replace('bg-', 'bg-opacity-10 ')}`}>
                             {timer.text}
                           </span>
                         )}
                      </td>
                      <td className="px-8 py-6">
                         <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                            c.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                         }`}>
                           {c.status}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                         {c.assignedPolice ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                {typeof c.assignedPolice === 'string' ? 'O' : c.assignedPolice.fullName.charAt(0)}
                              </div>
                              <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">
                                {typeof c.assignedPolice === 'string' ? 'Officer Assigned' : c.assignedPolice.fullName}
                              </span>
                            </div>
                         ) : (
                            <span className="text-red-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 bg-red-50 rounded-full border border-red-100">
                              <AlertTriangle size={12}/> Needs Assignment
                            </span>
                         )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => navigate(`/case/${c._id}`)} className="p-3 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all group-hover:shadow-lg group-hover:shadow-blue-100">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};