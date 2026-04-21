import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';

// LEAFLET IMPORTS
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { 
  FileText, Activity, CheckCircle, Clock, 
  AlertTriangle, EyeOff, ChevronRight, Shield, AlertCircle, Bell, X, Scale, Download,
  FolderLock, Upload, Trash2, Info, Navigation, Sparkles, Globe, ArrowUpRight,
  Sun, Moon, Eye, User as UserIcon, CheckCircle2, MapPin
} from 'lucide-react';
import { Notifications } from '../Notifications';
import { KnowYourRights } from '../KnowYourRights';
import { LivePatrolTracker } from '../LivePatrolTracker';
import { ProfileModel } from '../ProfileModel';

// FIX LEAFLET DEFAULT ICON ISSUE
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

interface PersonalDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

interface LegalNotice {
  _id: string;
  noticeNumber: string;
  caseNumber: string;
  subject: string;
  description: string;
  issuerRole: string;
  issuerName: string;
  noticeDate: string;
  location: string;
}

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  deadlineDate: string;
  createdAt: string;
  isAnonymous: boolean;
  interestedLawyers: any[];
  assignedLawyer?: any;
}

export const CitizenDashboard: React.FC = () => {
  const { user, token } = useAuth(); 
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [cases, setCases] = useState<Case[]>([]);
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);
  const [personalDocs, setPersonalDocs] = useState<PersonalDocument[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<LegalNotice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSOSTracker, setShowSOSTracker] = useState(false);
  const [isSOSMinimized, setIsSOSMinimized] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- LOCATION STATES ---
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [registeredAddress, setRegisteredAddress] = useState<string>("Loading profile...");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [sosActiveAddress, setSosActiveAddress] = useState("Locating...");
  const [manualAddress, setManualAddress] = useState("");

  const fetchData = async () => {
    try {
      const apiUrl = getApiUrl();
      
      // 1. Fetch Cases
      const casesRes = await fetch(`${apiUrl}/cases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (casesRes.ok) {
        setCases(await casesRes.json());
      }

      // 2. Fetch Legal Notices
      const noticesRes = await fetch(`${apiUrl}/legal-notice/citizen/matching`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (noticesRes.ok) {
        const noticesData = await noticesRes.json();
        setLegalNotices(Array.isArray(noticesData) ? noticesData : []);
      }

      // 3. Fetch Personal Documents
      const docsRes = await fetch(`${apiUrl}/users/${user?.userId || user?._id || user?.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (docsRes.ok) {
        setPersonalDocs(await docsRes.json());
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
      
      // Initial Location Setup
      if (user) {
        setRegisteredAddress(user.address || "Address not registered");
        if (user.lat && user.lng) {
          setCurrentCoords({ lat: user.lat, lng: user.lng });
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
        }
      }
    }
  }, [token, user]);

  const handleAppointLawyer = async (caseId: string, lawyerId: string) => {
    if(!confirm("CONFIRM APPOINTMENT: This advocate will gain access to your case files and represent you in court.")) return;
    try {
      const res = await fetch(`${getApiUrl()}/cases/${caseId}/appoint-lawyer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lawyerId })
      });
      if (res.ok) {
        alert("Advocate Appointed Successfully.");
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateRegisteredLocation = () => {
    setIsUpdatingLocation(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setIsUpdatingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentCoords({ lat, lng });

        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const geoData = await geoRes.json();
        const streetAddress = geoData.display_name || "Unknown Location";

        const res = await fetch(`${getApiUrl()}/users/update-location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ address: streetAddress, lat, lng })
        });

        if (res.ok) {
          setRegisteredAddress(streetAddress);
          alert("✅ Secure location successfully registered.");
        }
      } catch (err) { console.error(err); } finally { setIsUpdatingLocation(false); }
    }, () => {
      alert("Location access denied.");
      setIsUpdatingLocation(false);
    });
  };

  const handleManualAddressSave = async () => {
    if (!manualAddress) return alert("Please type an address.");
    setIsUpdatingLocation(true);
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress)}&format=json`);
      const geoData = await geoRes.json();
      let lat = 12.9716, lng = 77.5946;
      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }
      const res = await fetch(`${getApiUrl()}/users/update-location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ address: manualAddress, lat, lng })
      });
      if (res.ok) {
        setRegisteredAddress(manualAddress);
        setCurrentCoords({ lat, lng });
        alert("✅ Address securely updated.");
      }
    } catch (err) { console.error(err); } finally { setIsUpdatingLocation(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/users/${user?.userId || user?._id}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileName: file.name, fileUrl: reader.result })
        });
        if (res.ok) { setPersonalDocs(await res.json()); }
      } catch (err) { console.error(err); } finally { setIsUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Remove this document from the vault?")) return;
    try {
      const res = await fetch(`${getApiUrl()}/users/${user?.userId || user?._id}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) { setPersonalDocs(await res.json()); }
    } catch (err) { console.error(err); }
  };

  const handleSOS = async () => {
    if(!confirm("⚠️ SEND EMERGENCY ALERT? \n\nThis will instantly notify the nearest Police Control Room.")) return;

    const sendSosToBackend = async (lat: number, lng: number, locationName: string) => {
      try {
        setSosActiveAddress(locationName);
        const res = await fetch(`${getApiUrl()}/notifications/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ location: locationName, lat: lat.toString(), lng: lng.toString() })
        });
        if (res.ok) {
          setShowSOSTracker(true);
          setIsSOSMinimized(false);
        }
      } catch (err) { 
        console.error(err);
        alert("Network Error. Please call 100 directly.");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let liveAddr = "Current Live Location";
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const geoData = await geoRes.json();
            if (geoData.display_name) liveAddr = geoData.display_name;
          } catch(e) {}
          await sendSosToBackend(lat, lng, liveAddr);
        },
        async () => {
          if (user?.lat && user?.lng) {
            alert("Live GPS signal weak. Using your Registered Profile Node.");
            await sendSosToBackend(user.lat, user.lng, registeredAddress);
          } else {
            alert("No registered address found. Cannot send SOS.");
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else if (user?.lat && user?.lng) {
      await sendSosToBackend(user.lat, user.lng, registeredAddress);
    }
  };

  const handleDownloadNotice = (notice: LegalNotice) => {
    const doc = new jsPDF();
    doc.text('LEGAL NOTICE', 14, 20);
    doc.text(`#${notice.noticeNumber}`, 14, 30);
    doc.text(`Subject: ${notice.subject}`, 14, 40);
    doc.save(`Notice-${notice.noticeNumber}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14] dark:bg-[#070b14] light:bg-slate-50 high-contrast:bg-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-indigo-400 font-black animate-pulse uppercase tracking-[0.3em] text-[10px]">Accessing Justice Records...</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans selection:bg-orange-500/30 overflow-x-hidden ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      {showSOSTracker && (
        <LivePatrolTracker 
          onCancel={() => setShowSOSTracker(false)}
          onMinimize={() => setIsSOSMinimized(true)}
          onExpand={() => setIsSOSMinimized(false)}
          isMinimized={isSOSMinimized}
          userLocation={sosActiveAddress} 
        />
      )}

      {/* HEADER */}
      <nav className={`sticky top-0 z-[100] border-b px-6 lg:px-12 py-4 backdrop-blur-2xl transition-all duration-500 ${
        theme === 'light' ? 'bg-white/80 border-slate-200' : 
        theme === 'high-contrast' ? 'bg-black border-white' : 
        'bg-[#070b14]/80 border-white/5'
      }`}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex flex-wrap w-[32px] h-[32px] gap-[3px] rotate-45 group-hover:rotate-0 transition-transform duration-500">
              <div className="w-[14px] h-[14px] bg-orange-600 rounded-sm"></div>
              <div className="w-[14px] h-[14px] bg-indigo-600 rounded-sm"></div>
              <div className="w-[14px] h-[14px] bg-indigo-400 rounded-sm"></div>
              <div className={`w-[14px] h-[14px] bg-transparent rounded-sm border ${theme === 'light' ? 'border-slate-300' : 'border-white/10'}`}></div>
            </div>
            <div>
              <h1 className={`text-lg font-black leading-tight tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Nyayasarthi</h1>
              <p className="text-indigo-400 font-bold text-[9px] uppercase tracking-[0.3em]">Justice Command</p>
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
            <div className={`flex-1 md:flex-none flex items-center gap-2 backdrop-blur-md px-4 py-2.5 rounded-2xl border transition-all ${theme === 'light' ? 'bg-slate-100 border-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 'bg-white/5 border-white/10'}`} onClick={() => setIsProfileOpen(true)}>
               < Globe size={14} className="text-slate-500" />
               <span className={`text-[10px] font-black uppercase tracking-widest cursor-pointer ${theme === 'light' ? 'text-slate-700' : 'text-slate-200'}`}>Digital Citizen: {user?.fullName}</span>
            </div>
            <div className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${theme === 'light' ? 'bg-slate-100 border-slate-200 hover:bg-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white hover:bg-zinc-800' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
               <Notifications />
            </div>
            <button onClick={handleSOS} className="px-6 py-2.5 bg-red-600 text-white rounded-2xl font-black text-[10px] hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)] uppercase tracking-[0.2em] animate-pulse border border-red-500/50">Trigger SOS</button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        {/* HERO STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {[
            { label: 'Case Load', val: cases.length, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
            { label: 'Active', val: cases.filter(c => c.status !== 'resolved').length, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: 'Resolved', val: cases.filter(c => c.status === 'resolved').length, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'AI Signal', val: 'Online', icon: Sparkles, color: 'text-white', bg: 'bg-gradient-to-br from-indigo-600 to-indigo-800', border: 'border-white/10', isAction: true }
          ].map((stat, i) => (
            <div key={i} onClick={stat.isAction ? () => navigate('/chat') : undefined} className={`p-8 rounded-[2.5rem] border transition-all duration-500 relative ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm shadow-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : `${stat.bg} ${stat.border}`} ${stat.isAction ? 'cursor-pointer hover:scale-[1.02] shadow-2xl' : ''} group`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border ${theme === 'light' ? 'bg-slate-50 border-slate-100 text-indigo-600' : theme === 'high-contrast' ? 'bg-black border-white text-white' : `${stat.bg} ${stat.color} ${stat.border}`}`}>
                <stat.icon size={24} />
              </div>
              <h3 className={`text-4xl font-black tracking-tighter mb-1 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.val}</h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className={`text-2xl font-black uppercase tracking-tighter flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><div className="w-1 h-8 bg-indigo-500 rounded-full"></div> Judicial Docket</h2>
            <button onClick={() => navigate('/file-case')} className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 group ${theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' : theme === 'high-contrast' ? 'bg-white text-black hover:bg-zinc-200' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'}`}>Initiate New Filing <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></button>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {cases.length === 0 ? (
              <div className={`p-24 text-center border-2 border-dashed rounded-[3rem] ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <Info size={48} className="mx-auto text-slate-700 opacity-20 mb-6" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No active statutory nodes detected</p>
              </div>
            ) : (
              cases.map((caseItem) => (
                <div key={caseItem._id} className={`backdrop-blur-xl rounded-[3rem] border transition-all duration-700 overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 'bg-white/5 border-white/10'}`}>
                  <div className="p-8 lg:p-12 space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div>
                        <div className="flex items-center gap-4 mb-3">
                          <h3 className={`text-2xl font-black tracking-tighter uppercase transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{caseItem.title}</h3>
                          <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-indigo-400 uppercase tracking-widest">ID: {caseItem.caseNumber}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Filed On: {new Date(caseItem.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => navigate(`/case/${caseItem._id}`)} className={`p-5 rounded-3xl border transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-600 hover:text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white hover:text-slate-950'}`}><ChevronRight size={24}/></button>
                    </div>

                    {/* INTERESTED LAWYERS SECTION */}
                    {!caseItem.assignedLawyer && caseItem.interestedLawyers && caseItem.interestedLawyers.length > 0 && (
                      <div className={`p-8 rounded-[2.5rem] border animate-in slide-in-from-top-4 duration-700 ${theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-600/5 border-indigo-500/20'}`}>
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><UserIcon size={20}/></div>
                          <div>
                            <h4 className={`text-sm font-black uppercase tracking-tight ${theme === 'light' ? 'text-indigo-900' : 'text-white'}`}>Intelligence Signal: {caseItem.interestedLawyers.length} Advocates Interested</h4>
                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Select a specialized representative to establish mandate.</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {caseItem.interestedLawyers.map((l: any) => (
                            <div key={l._id} className={`p-6 rounded-[2rem] border transition-all group ${theme === 'light' ? 'bg-white border-slate-200 hover:border-indigo-400' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs uppercase">{l.fullName.charAt(0)}</div>
                                <div>
                                  <p className={`text-xs font-black uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{l.fullName}</p>
                                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{l.specialization} Expert</p>
                                </div>
                              </div>
                              <button onClick={() => handleAppointLawyer(caseItem._id, l._id)} className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-xl ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'}`}>Appoint Advocate</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {caseItem.assignedLawyer && (
                      <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${theme === 'light' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                        <div className="flex items-center gap-4">
                          <CheckCircle2 size={20} />
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight">Assigned Counsel: Adv. {caseItem.assignedLawyer.fullName}</p>
                            <p className="text-[8px] font-bold uppercase opacity-70 tracking-widest">Legal Representation Established</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAP VIEW */}
        <div className={`p-8 lg:p-12 rounded-[3rem] border transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
          <h2 className={`text-2xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <MapPin className="text-indigo-500" /> Current Node Coverage
          </h2>
          <div className="h-[400px] w-full rounded-[2rem] overflow-hidden border border-white/10 relative z-0">
            <MapContainer 
              key={currentCoords ? `${currentCoords.lat}-${currentCoords.lng}` : 'default-map'}
              center={currentCoords ? [currentCoords.lat, currentCoords.lng] : [12.9716, 77.5946]} 
              zoom={13} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url={theme === 'light' ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"} />
              {currentCoords && (
                <Marker position={[currentCoords.lat, currentCoords.lng]}>
                  <Popup>
                    <div className="font-black text-[10px] uppercase">Jurisdiction Center</div>
                    <div className="text-xs">{registeredAddress}</div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        </div>

        {/* JURISDICTION & VAULT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`lg:col-span-2 backdrop-blur-md rounded-[3rem] p-10 lg:p-12 border relative overflow-hidden group transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000"><FolderLock size={300} /></div>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12 relative z-10">
              <div>
                <h2 className={`text-3xl font-black tracking-tighter uppercase flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20"><FolderLock size={28} /></div> Vault Storage</h2>
                <p className={`text-xs font-bold uppercase tracking-widest mt-4 ${theme === 'light' ? 'text-slate-500' : 'text-slate-200'}`}>Zero-Knowledge Encrypted Judicial Locker</p>
              </div>
              <label className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-2xl ${isUploading ? 'bg-white/5 text-slate-500' : theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'}`}>
                {isUploading ? <Activity size={18} className="animate-spin" /> : <Upload size={18} />} {isUploading ? 'Securing...' : 'Encrypt New File'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {personalDocs.map(doc => (
                <div key={doc._id} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 group/doc ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:bg-indigo-50' : 'bg-white/5 border-white/5 hover:bg-white hover:text-slate-950'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-indigo-600' : 'bg-white/5 border-white/10 text-indigo-400'}`}><FileText size={20} /></div>
                    <div className="min-w-0">
                      <p className="font-black text-xs truncate uppercase tracking-tight">{doc.fileName}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                    <button onClick={() => window.open(doc.fileUrl, '_blank')} className="p-2 hover:bg-slate-900 hover:text-white rounded-lg text-slate-300"><Download size={16} /></button>
                    <button onClick={() => handleDeleteDoc(doc._id)} className="p-2 hover:bg-red-600 hover:text-white rounded-lg text-slate-300"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-8">
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/5'}`}>
              <h3 className="text-xl font-black tracking-tighter uppercase mb-4 flex items-center gap-3"><MapPin className="text-indigo-500" /> Jurisdiction Profile</h3>
              <p className={`text-sm font-bold truncate mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{registeredAddress}</p>
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Type Address..." value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-200 focus:border-indigo-500' : 'bg-black/20 border-white/10 text-white focus:border-indigo-500'}`} />
                <button onClick={handleManualAddressSave} disabled={isUpdatingLocation || !manualAddress} className="px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Save</button>
              </div>
              <button onClick={handleUpdateRegisteredLocation} disabled={isUpdatingLocation} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                {isUpdatingLocation ? <Activity size={16} className="animate-spin" /> : <Navigation size={16} />} Sync GPS
              </button>
            </div>
            <div className="space-y-6">
               <h3 className={`text-[10px] font-black uppercase tracking-[0.5em] pl-6 border-l ${theme === 'light' ? 'text-slate-400 border-slate-200' : 'text-slate-500 border-slate-800'}`}>Know Your Justice</h3>
               <div className="pl-6"><KnowYourRights context="general" className={`${theme === 'light' ? '!bg-white !border-slate-200 !text-slate-700' : '!bg-white/5 !border-white/10 !text-slate-200'}`} /></div>
            </div>
          </div>
        </div>
      </div>

      {selectedNotice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-4 animate-in fade-in duration-500" onClick={() => setSelectedNotice(null)}>
          <div className={`rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'}`} onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-950 p-10 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Scale size={200} /></div>
              <div className="flex items-center gap-8 relative z-10"><div className="w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center text-white"><Scale size={40} /></div><div><h2 className="text-3xl font-black tracking-tighter uppercase">Statutory Notice</h2><p className="text-orange-500 font-bold font-mono text-[12px] uppercase tracking-[0.3em] mt-2">ID: #{selectedNotice.noticeNumber}</p></div></div>
              <button onClick={() => setSelectedNotice(null)} className="p-4 bg-white/5 hover:bg-red-600 rounded-2xl border border-white/10 relative z-10"><X size={24}/></button>
            </div>
            <div className={`p-12 overflow-y-auto ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-900'}`}>
              <div className={`p-12 rounded-[3rem] border shadow-2xl ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'}`}>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-8">Official Statement</h4>
                <p className={`text-2xl font-black leading-[1.1] uppercase tracking-tight mb-12 border-b pb-12 ${theme === 'light' ? 'text-slate-900 border-slate-100' : 'text-white border-slate-700'}`}>"{selectedNotice.subject}"</p>
                <p className={`font-medium text-base leading-relaxed ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>{selectedNotice.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      <ProfileModel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
    </div>
  );
};