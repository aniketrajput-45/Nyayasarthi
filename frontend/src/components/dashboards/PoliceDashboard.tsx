import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { 
  Shield, CheckCircle, MessageSquare, BookOpen, 
  Users, AlertTriangle, FileText, Clock, TrendingUp, MapPin, 
  ChevronRight, Zap, Sparkles, Map as MapIcon, Target, Globe, Navigation, X,
  Sun, Moon, Eye, User as UserIcon // <-- ADDED UserIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Notifications } from '../Notifications'; 
import { io } from 'socket.io-client';
import { ProfileModel } from '../ProfileModel'; // <-- ADDED MODAL IMPORT

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Case {
  _id: string;
  title: string;
  caseNumber: string;
  status: string;
  type: string;
  location: string;
  description: string;
  incidentDate: string;
  deadlineDate: string;
  assignedPolice?: any; 
  filedBy: { fullName: string; email: string };
}

interface SOSAlert {
  id: string;
  message: string;
  location: string;
  citizenName: string;
  lat: string;
  lng: string;
  timestamp: number;
  targetOfficers?: string[];
}

export const PoliceDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [stationCases, setStationCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'map'>('queue');
  const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // <-- ADDED PROFILE MODAL STATE

  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({ myActive: 0, stationTotal: 0, unassigned: 0 });

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
    socket.on('sos_alert', (data: any) => {
      const myId = user?.userId || user?._id;
      if (data.targetOfficers && !data.targetOfficers.includes(myId)) {
        return; 
      }

      const newAlert: SOSAlert = {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: Date.now()
      };
      setSosAlerts(prev => [newAlert, ...prev]);
      
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2558/2558-preview.mp3');
        audio.play();
      } catch (e) {}
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const removeAlert = (id: string) => {
    setSosAlerts(prev => prev.filter(a => a.id !== id));
  };

  const prioritizeCases = (cases: Case[]) => {
    return [...cases].sort((a, b) => {
      const severity: Record<string, number> = { criminal: 3, cyber: 2, civil: 1, corporate: 1 };
      const scoreA = severity[a.type] || 0;
      const scoreB = severity[b.type] || 0;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
    });
  };

  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)); 
    if (diff < 0) return { color: 'text-red-500 border-red-500/20 bg-red-500/5', text: `${Math.abs(diff)}D OVERDUE`, icon: AlertTriangle };
    if (diff < 15) return { color: 'text-orange-500 border-orange-500/20 bg-orange-500/5', text: `${diff}D LEFT`, icon: Clock };
    return { color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5', text: `${diff}D REMAINING`, icon: Shield };
  };

  const isAssignedToMe = (c: Case) => {
    const assignedId = typeof c.assignedPolice === 'string' ? c.assignedPolice : c.assignedPolice?._id;
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
          setMyCases(prioritizeCases(mine));
          setStationCases(allCases.filter(c => !isAssignedToMe(c)));
          setStats({ myActive: mine.length, stationTotal: allCases.length, unassigned: unassignedCount });
          setChartData([
            { name: 'My Cases', value: mine.length, color: '#6366f1' },      
            { name: 'Unassigned', value: unassignedCount, color: '#f97316' }, 
            { name: 'Station', value: allCases.length - mine.length - unassignedCount, color: '#334155' }  
          ]);
        }
      } catch (error) {} finally { setLoading(false); }
    };
    fetchCases();
  }, [token, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14] dark:bg-[#070b14] light:bg-slate-50 high-contrast:bg-black transition-colors duration-500">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
        <p className="text-blue-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Booting Tactical Command...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500/30 overflow-x-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      {/* HEADER */}
      <nav className={`sticky top-0 z-[100] border-b px-6 lg:px-12 py-4 backdrop-blur-2xl transition-all duration-500 ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 
        theme === 'high-contrast' ? 'bg-black border-white' : 
        'bg-[#070b14]/80 border-white/5'
      }`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20">
              <Shield size={24} />
            </div>
            <div>
              <h1 className={`text-lg font-black leading-tight tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Nyayasarthi</h1>
              <p className="text-blue-400 font-bold text-[9px] uppercase tracking-[0.3em]">Digital Police Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={toggleTheme} className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 ${
                theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 
                theme === 'high-contrast' ? 'bg-zinc-900 border-white text-white hover:bg-zinc-800' : 
                'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`} title="Switch Accessibility Mode">
              {theme === 'dark' && <Moon size={18} />}
              {theme === 'light' && <Sun size={18} />}
              {theme === 'high-contrast' && <Eye size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Mode</span>
            </button>

            {/* --- ADDED PROFILE MODAL TRIGGER BUTTON FOR POLICE --- */}
            <button 
              onClick={() => setIsProfileOpen(true)}
              className={`flex-1 md:flex-none flex flex-col justify-center backdrop-blur-md px-5 py-2.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
               <div className="flex items-center gap-2 mb-0.5">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>
                   {user?.role}: {user?.fullName}
                 </span>
               </div>
               <div className="flex items-center gap-1.5 text-blue-500 max-w-[250px] sm:max-w-[400px]">
                 <UserIcon size={12} className="shrink-0" />
                 <span className="text-[9px] font-bold uppercase truncate">View Full Profile & Jurisdictions</span>
               </div>
            </button>

            <div className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
              theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 
              'bg-white/5 border-white/10 hover:bg-white/10'
            }`}>
               <Notifications />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        
        {/* SOS ALERTS SECTION */}
        {sosAlerts.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-2xl font-black text-red-500 uppercase tracking-tighter flex items-center gap-4">
              <div className="w-1 h-8 bg-red-600 rounded-full animate-pulse"></div>
              Active Emergency Signals
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sosAlerts.map(alert => (
                <div key={alert.id} className="bg-red-600 rounded-[2.5rem] p-8 text-white shadow-[0_0_50px_rgba(220,38,38,0.3)] border border-red-400/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <AlertTriangle size={120} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
                          <Navigation size={24} className="fill-current" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-100">Immediate Dispatch Required</p>
                          <h3 className="text-2xl font-black uppercase tracking-tight">{alert.citizenName}</h3>
                        </div>
                      </div>
                      <button onClick={() => removeAlert(alert.id)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-red-50">
                        <MapPin size={18} />
                        <span className="text-sm font-bold uppercase tracking-wide">{alert.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-red-50">
                        <Globe size={18} />
                        <span className="text-xs font-mono">GPS: {alert.lat}, {alert.lng}</span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button className="flex-1 py-4 bg-white text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all shadow-xl shadow-red-900/20">
                        Dispatch Nearest Unit
                      </button>
                      <button onClick={() => setActiveTab('map')} className="px-6 py-4 bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-800 transition-all border border-red-500/50">
                        View Map
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: 'Tactical Load', val: stats.myActive, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Needs Assignment', val: stats.unassigned, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Monthly Clearance', val: stats.stationTotal - stats.unassigned, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Workload Load', val: 'Optimized', icon: Zap, color: 'text-white', bg: 'bg-gradient-to-br from-blue-600 to-indigo-800', border: 'border-white/10', isChart: true }
          ].map((stat, i) => (
            <div key={i} className={`p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden relative ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm shadow-slate-200' : 
              theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
              `${stat.bg} ${stat.border}`
            } group`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border ${
                theme === 'light' ? 'bg-slate-50 border-slate-100 text-blue-600' : 
                theme === 'high-contrast' ? 'bg-black border-white text-white' : 
                `${stat.bg} ${stat.color} ${stat.border}`
              }`}>
                <stat.icon size={24} />
              </div>
              {stat.isChart ? (
                <div className="h-12 w-full mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={chartData} innerRadius={15} outerRadius={22} dataKey="value">{chartData.map((e, idx) => <Cell key={idx} fill={e.color} />)}</Pie></PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <h3 className={`text-4xl font-black tracking-tighter mb-1 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.val}</h3>
              )}
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* TABS: QUEUE & MAP */}
        <div className={`backdrop-blur-xl rounded-[3rem] border overflow-hidden shadow-2xl transition-all duration-500 ${
          theme === 'light' ? 'bg-white border-slate-200' : 
          theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
          'bg-white/5 border-white/10'
        }`}>
          <div className={`flex border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
            <button onClick={() => setActiveTab('queue')} className={`flex-1 py-8 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${activeTab === 'queue' ? (theme === 'light' ? 'text-blue-600 bg-slate-50' : 'text-blue-400 bg-white/5') : 'text-slate-500 hover:text-slate-300'}`}><Zap size={18} /> AI Task Queue</button>
            <button onClick={() => setActiveTab('map')} className={`flex-1 py-8 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${activeTab === 'map' ? (theme === 'light' ? 'text-blue-600 bg-slate-50' : 'text-blue-400 bg-white/5') : 'text-slate-500 hover:text-slate-300'}`}><MapIcon size={18} /> Jurisdiction Heatmap</button>
          </div>

          <div className="p-8 lg:p-12">
            {/* QUEUE TAB */}
            {activeTab === 'queue' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex justify-between items-center">
                  <h3 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><Sparkles className="text-blue-500" size={20} /> Priority Investigations</h3>
                  <div className={`px-4 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>AI Ranked by BNSS Statute</div>
                </div>

                {myCases.length === 0 ? (
                  <div className={`p-20 text-center rounded-[2.5rem] border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                    <Target size={48} className="mx-auto text-slate-800 mb-6" />
                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No active dispatch signals</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {myCases.map((c, idx) => {
                      const timer = getTimerStatus(c.deadlineDate);
                      return (
                        <div key={c._id} className={`p-8 border rounded-[2.5rem] transition-all duration-500 group ${
                          theme === 'light' ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50' : 
                          theme === 'high-contrast' ? 'bg-black border-white hover:bg-zinc-900' : 
                          'bg-white/5 border-white/5 hover:border-blue-500/30'
                        }`}>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex gap-5">
                              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform">0{idx + 1}</div>
                              <div>
                                <h4 className={`text-lg font-black uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900 group-hover:text-blue-600' : 'text-white group-hover:text-blue-400'}`}>{c.title}</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Ref: {c.caseNumber}</p>
                              </div>
                            </div>
                            {timer && <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${timer.color}`}>{timer.text}</span>}
                          </div>
                          <p className={`text-xs font-medium leading-relaxed mb-8 line-clamp-2 italic ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>"{c.description}"</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/5 text-slate-300'}`}><MapPin size={10}/> {c.location}</span></div>
                            <button onClick={() => navigate(`/case/${c._id}`)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Access Evidence &rarr;</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MAP TAB */}
            {activeTab === 'map' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={`rounded-[3rem] p-10 relative overflow-hidden min-h-[600px] border shadow-2xl transition-all duration-500 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 
                  theme === 'high-contrast' ? 'bg-black border-white' : 
                  'bg-slate-950 border-white/5'
                }`}>
                   <div className="relative z-10 h-full">
                      <h3 className={`font-black text-2xl flex items-center gap-3 uppercase tracking-tighter ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        <MapIcon size={24} className="text-blue-500" /> Jurisdiction Real-Time Map
                      </h3>
                      
                      <div className={`mt-12 relative h-[450px] w-full border rounded-[2rem] overflow-hidden transition-all duration-500 z-0 ${
                        theme === 'light' ? 'bg-white border-slate-200 shadow-inner' : 'bg-black/40 border-white/5'
                      }`}>
                        <MapContainer 
                          center={sosAlerts.length > 0 ? [parseFloat(sosAlerts[0].lat), parseFloat(sosAlerts[0].lng)] : [12.9716, 77.5946]} 
                          zoom={13} 
                          style={{ height: '100%', width: '100%' }}
                        >
                          <TileLayer
                            url={theme === 'light' 
                              ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            }
                          />
                          {sosAlerts.map(alert => (
                            <Marker 
                              key={alert.id} 
                              position={[parseFloat(alert.lat), parseFloat(alert.lng)]}
                              icon={L.divIcon({
                                className: 'custom-icon',
                                html: `<div style="background-color: #dc2626; padding: 6px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(220, 38, 38, 1); color: white; display:flex; align-items:center; justify-content:center; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;">🚨</div>`
                              })}
                            >
                              <Popup>
                                <div className="font-black text-red-600 uppercase tracking-tighter text-sm mb-1">{alert.citizenName}</div>
                                <div className="text-xs font-bold text-slate-800">EMERGENCY SOS</div>
                                <div className="text-xs text-slate-600 mt-1">{alert.location}</div>
                              </Popup>
                            </Marker>
                          ))}
                        </MapContainer>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* REGISTRY SECTION */}
        <div className="space-y-8">
          <h2 className={`text-2xl font-black uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <div className="w-1 h-8 bg-white rounded-full"></div>
            Station General Registry
          </h2>
          <div className={`backdrop-blur-md rounded-[3rem] border overflow-hidden transition-all duration-500 ${
            theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 
            theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
            'bg-white/5 border-white/5'
          }`}>
            <table className="w-full text-left">
              <thead className={`${theme === 'light' ? 'bg-slate-50' : 'bg-white/5'} border-b ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                <tr>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Investigation Profile</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Statutory Deadline</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Assignment</th>
                  <th className="px-10 py-8 text-right"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                {stationCases.map(c => {
                  const timer = getTimerStatus(c.deadlineDate);
                  return (
                    <tr key={c._id} className={`transition-colors group ${theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5'}`}>
                      <td className="px-10 py-8">
                        <div className={`font-black text-sm uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{c.title}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Node ID: {c.caseNumber}</div>
                      </td>
                      <td className="px-10 py-8">
                         {timer && <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase border ${timer.color}`}>{timer.text}</span>}
                      </td>
                      <td className="px-10 py-8">
                         {c.assignedPolice ? (
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border uppercase ${
                                theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'
                              }`}>{typeof c.assignedPolice === 'string' ? 'O' : c.assignedPolice.fullName.charAt(0)}</div>
                              <span className={`text-[10px] font-black uppercase tracking-tight ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{typeof c.assignedPolice === 'string' ? 'Officer Assigned' : c.assignedPolice.fullName}</span>
                            </div>
                         ) : (
                            <span className="text-red-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 px-3 py-1 bg-red-500/5 rounded-full border border-red-500/20"><AlertTriangle size={12}/> Needs Officer</span>
                         )}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button onClick={() => navigate(`/case/${c._id}`)} className={`p-4 rounded-2xl transition-all group-hover:shadow-2xl ${
                          theme === 'light' ? 'bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white' : 
                          'bg-white/5 text-slate-500 hover:bg-blue-600 hover:text-white'
                        }`}>
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

      {/* --- ADDED PROFILE MODAL AT THE BOTTOM --- */}
      <ProfileModel 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
      />
    </div>
  );
};