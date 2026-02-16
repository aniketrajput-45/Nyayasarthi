import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Shield, CheckCircle, MessageSquare, BookOpen, 
  Users, AlertTriangle, FileText, Clock 
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

  // Stats
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    myActive: 0,
    stationTotal: 0,
    unassigned: 0
  });

  // --- TIMER LOGIC (Same as Judge) ---
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

          setMyCases(mine);
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

  if (loading) return <div className="p-8 text-center">Loading Station Records...</div>;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Shield className="text-blue-600" size={32} /> Police Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Officer {user?.fullName || 'Active'} • Station Command Center</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="bg-white p-2 rounded-full shadow-sm border border-slate-200">
             <Notifications /> 
           </div>
           <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-900">{user?.fullName}</p>
              <p className="text-xs text-slate-500 uppercase">{user?.role}</p>
           </div>
        </div>
      </div>

      {/* ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Shield size={20} /></div>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">PRIORITY</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{stats.myActive}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">My Active Cases</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20} /></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{stats.unassigned}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">Pending Assignment</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><FileText size={20} /></div>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900">{stats.stationTotal}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">Total Station Load</p>
              </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider w-full text-left mb-2">Workload Distribution</h4>
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* MY ACTIVE INVESTIGATIONS */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          <CheckCircle size={20} /> My Assignments ({myCases.length})
        </h3>
        
        {myCases.length === 0 ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-8 text-center">
            <p className="text-blue-800 font-medium">No active investigations.</p>
            <p className="text-blue-600 text-sm">You are currently free for new assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myCases.map(c => {
               const timer = getTimerStatus(c.deadlineDate);
               return (
                <div key={c._id} className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden ring-1 ring-blue-100 hover:shadow-lg transition-shadow">
                  <div className="p-5 border-b border-slate-100 bg-blue-50/50 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{c.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                          {c.caseNumber}
                        </span>
                        {/* DEADLINE BADGE */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase ${timer.color}`}>
                           <timer.icon size={10} /> {timer.text}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/case/${c._id}`)}
                      className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="p-5">
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{c.description}</p>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/chat')} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                          <MessageSquare size={14}/> Chat
                        </button>
                        <button className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2">
                          <BookOpen size={14}/> Diary
                        </button>
                    </div>
                  </div>
                </div>
               );
            })}
          </div>
        )}
      </div>

      {/* STATION REGISTRY */}
      <div>
        <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Users size={20} /> Station General Registry ({stationCases.length})
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Case Details</th>
                <th className="px-6 py-4">Deadline</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned Officer</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stationCases.map(c => {
                const timer = getTimerStatus(c.deadlineDate);
                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{c.title}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.caseNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${timer.color.split(' ')[0]} ${timer.color.split(' ')[1]}`}>
                         {timer.text}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                          c.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'
                       }`}>
                         {c.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                       {c.assignedPolice ? (
                          <span className="flex items-center gap-1">
                            <Shield size={12} className="text-blue-500"/> 
                            {typeof c.assignedPolice === 'string' ? 'Assigned' : c.assignedPolice.fullName}
                          </span>
                       ) : (
                          <span className="text-orange-500 font-bold text-xs flex items-center gap-1">
                            <AlertTriangle size={10}/> UNASSIGNED
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/case/${c._id}`)} className="text-blue-600 hover:text-blue-800 text-xs font-bold">
                        View
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
  );
};