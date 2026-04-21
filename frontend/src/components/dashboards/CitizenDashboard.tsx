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
  Sun, Moon, Eye, MapPin, User as UserIcon
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

interface PersonalDocument {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  isAnonymous: boolean;
  createdAt: string;
  deadlineDate: string;
  location?: string;
  incidentDate?: string;
}

interface LegalNotice {
  _id: string;
  noticeNumber: string;
  caseNumber?: string;
  noticeType: string;
  urgency: string;
  subject: string;
  incidentTitle: string;
  caseType: string;
  location: string;
  dateOfIncident: string;
  description: string;
  noticeDate: string;
  issuedBy: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  issuerRole: string;
  issuerName: string;
}

export const CitizenDashboard: React.FC = () => {
  const { user, token } = useAuth(); 
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>([]);
  const [personalDocs, setPersonalDocs] = useState<PersonalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showSOSTracker, setShowSOSTracker] = useState(false);
  const [isSOSMinimized, setIsSOSMinimized] = useState(false);

  // --- LOCATION STATES ---
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [registeredAddress, setRegisteredAddress] = useState<string>("Loading profile...");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [sosActiveAddress, setSosActiveAddress] = useState("Locating...");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // PART A: Manual Address State
  const [manualAddress, setManualAddress] = useState("");

  useEffect(() => {
    if (user) {
      if (user.address) {
        setRegisteredAddress(user.address);
      } else {
        setRegisteredAddress("Address not registered");
      }

      if (user.lat && user.lng) {
        setCurrentCoords({ lat: user.lat, lng: user.lng });
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        });
      }
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = getApiUrl();
        const casesRes = await fetch(`${apiUrl}/cases`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (casesRes.ok) {
          const casesData = await casesRes.json();
          setCases(casesData);
        }

        const noticesRes = await fetch(`${apiUrl}/legal-notice/citizen/matching`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (noticesRes.ok) {
          const noticesData = await noticesRes.json();
          setLegalNotices(Array.isArray(noticesData) ? noticesData : []);
        }

        const docsRes = await fetch(`${apiUrl}/users/${user?.id || user?._id || user?.userId}/documents`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (docsRes.ok) {
          setPersonalDocs(await docsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token, user]);

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

        const apiUrl = getApiUrl();
        const saveRes = await fetch(`${apiUrl}/users/update-location`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ address: streetAddress, lat, lng })
        });

        if (saveRes.ok) {
          setRegisteredAddress(streetAddress);
          alert("✅ Secure location successfully registered to your profile.");
          window.location.reload(); 
        }
      } catch (err) {
        console.error("Error updating location:", err);
        alert("Failed to update location.");
      } finally {
        setIsUpdatingLocation(false);
      }
    }, (err) => {
      alert("Please allow location access to register your address.");
      setIsUpdatingLocation(false);
    });
  };

  // PART B: Save Typed Address and auto-generate GPS coordinates
  const handleManualAddressSave = async () => {
    if (!manualAddress) return alert("Please type an address first.");
    setIsUpdatingLocation(true);

    try {
      // 1. Convert Typed Address into GPS Coordinates (Forward Geocoding)
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualAddress)}&format=json`);
      const geoData = await geoRes.json();

      let lat = null;
      let lng = null;

      if (geoData && geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      } else {
        alert("Could not find exact GPS coordinates for this address on the map. We will save the text, but auto-routing might be less accurate.");
      }

      // 2. Save Address and Coordinates to Database
      const apiUrl = getApiUrl();
      const saveRes = await fetch(`${apiUrl}/users/update-location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ address: manualAddress, lat, lng })
      });

      if (saveRes.ok) {
        setRegisteredAddress(manualAddress);
        if (lat && lng) setCurrentCoords({ lat, lng });
        alert("✅ Address securely updated.");
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update location.");
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/users/${user?.id || user?._id || user?.userId}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ fileName: file.name, fileUrl: reader.result })
        });
        if (res.ok) {
          setPersonalDocs(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Remove this document from the vault?")) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/users/${user?.id || user?._id || user?.userId}/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPersonalDocs(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const handleSOS = async () => {
    if(!confirm("⚠️ SEND EMERGENCY ALERT? \n\nThis will instantly notify the nearest Police Control Room.")) return;

    const sendSosToBackend = async (lat: number, lng: number, locationName: string) => {
      try {
        setSosActiveAddress(locationName);
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/notifications/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ location: locationName, lat, lng })
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
        async (err) => {
          if (user?.lat && user?.lng) {
            alert("Live GPS signal weak. Sending SOS using your Registered Profile Node.");
            await sendSosToBackend(user.lat, user.lng, registeredAddress);
          } else {
            alert("Location access denied and no registered address found. Cannot send SOS.");
          }
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      if (user?.lat && user?.lng) {
        await sendSosToBackend(user.lat, user.lng, registeredAddress);
      } else {
        alert("No GPS support and no registered address found.");
      }
    }
  };

  const handleCancelSOS = () => {
    if(confirm("⚠️ CANCEL EMERGENCY ALERT? \n\nOnly cancel if you are safe. This will notify dispatch that assistance is no longer required.")) {
      setShowSOSTracker(false);
      setIsSOSMinimized(false);
    }
  };

  const getTimerStatus = (deadline?: string) => {
    if (!deadline) return null;
    const today = new Date();
    const due = new Date(deadline);
    const diffTime = due.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (daysLeft < 0) return { color: 'text-red-500 border-red-500/20 bg-red-500/5', text: `${Math.abs(daysLeft)}D OVERDUE`, icon: AlertCircle };
    if (daysLeft < 15) return { color: 'text-orange-500 border-orange-500/20 bg-orange-500/5', text: `${daysLeft}D LEFT`, icon: Clock };
    return { color: 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5', text: `${daysLeft}D REMAINING`, icon: CheckCircle };
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(79,70,229,0.3)]"></div>
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
          onCancel={handleCancelSOS}
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
               <div className="flex items-center gap-1.5 text-indigo-500 max-w-[250px] sm:max-w-[400px]">
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
            <button onClick={handleSOS} className="px-6 py-2.5 bg-red-600 text-white rounded-2xl font-black text-[10px] hover:bg-red-700 transition-all shadow-[0_0_30px_rgba(220,38,38,0.2)] uppercase tracking-[0.2em] animate-pulse border border-red-500/50">
              Trigger SOS
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        {/* HERO STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* PERMANENT MAP VIEW */}
        <div className={`p-8 lg:p-12 rounded-[3rem] border transition-all duration-500 ${
          theme === 'light' ? 'bg-white border-slate-200' : 
          theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 
          'bg-white/5 border-white/5'
        }`}>
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
              <TileLayer
                url={theme === 'light' 
                  ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                }
              />
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

        {/* UTILITIES GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`lg:col-span-2 backdrop-blur-md rounded-[3rem] p-10 lg:p-12 border relative overflow-hidden group transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200' : theme === 'high-contrast' ? 'bg-zinc-900 border-white' : 'bg-white/5 border-white/5'}`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:rotate-12 transition-transform duration-1000"><FolderLock size={300} /></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12 relative z-10">
              <div>
                <h2 className={`text-3xl font-black tracking-tighter uppercase flex items-center gap-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20"><FolderLock size={28} /></div>
                  Vault Storage
                </h2>
                <p className={`text-xs font-bold uppercase tracking-widest mt-4 ${theme === 'light' ? 'text-slate-500' : 'text-slate-200'}`}>Zero-Knowledge Encrypted Judicial Locker</p>
              </div>
              <label className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-3 shadow-2xl ${
                isUploading ? 'bg-white/5 text-slate-500' : 
                theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white hover:shadow-indigo-500/40'
              }`}>
                {isUploading ? <Activity size={18} className="animate-spin" /> : <Upload size={18} />}
                {isUploading ? 'Securing...' : 'Encrypt New File'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            {personalDocs.length === 0 ? (
              <div className={`py-24 text-center rounded-[2.5rem] border ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>
                <Info size={48} className="mx-auto text-slate-800 mb-6" />
                <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">No encrypted nodes detected</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                {personalDocs.map(doc => (
                  <div key={doc._id} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 group/doc ${
                    theme === 'light' ? 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200' : 
                    theme === 'high-contrast' ? 'bg-black border-white hover:bg-zinc-800' : 
                    'bg-white/5 border-white/5 hover:bg-white hover:text-slate-950'
                  }`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-white border-slate-200 text-indigo-600' : 'bg-white/5 border-white/10 text-indigo-400 group-hover/doc:bg-indigo-600 group-hover/doc:text-white'}`}><FileText size={20} /></div>
                      <div className="min-w-0">
                        <p className={`font-black text-xs truncate uppercase tracking-tight transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white group-hover/doc:text-slate-950'}`}>{doc.fileName}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">Verified: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                      <button onClick={() => window.open(doc.fileUrl, '_blank')} className="p-2 hover:bg-slate-900 hover:text-white rounded-lg transition-all text-slate-300"><Download size={16} /></button>
                      <button onClick={() => handleDeleteDoc(doc._id)} className="p-2 hover:bg-red-600 hover:text-white rounded-lg transition-all text-slate-300"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-8">
            {/* PART C: UPDATED LOCATION REGISTRY CARD */}
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'
            }`}>
              <h3 className="text-xl font-black tracking-tighter uppercase mb-4 flex items-center gap-3">
                <MapPin className="text-indigo-500" /> Jurisdiction Profile
              </h3>
              <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                Set your primary node to ensure emergency services and legal routing default to your correct local police station.
              </p>
              
              <div className="p-4 bg-slate-900/5 rounded-2xl border border-slate-900/10 mb-6">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Node</p>
                <p className={`text-sm font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {registeredAddress}
                </p>
              </div>

              <div className="mb-4">
                <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Type Address Manually</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter City, Area, or Street..."
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500' : 'bg-black/20 border-white/10 text-white placeholder-slate-500 focus:border-indigo-500'
                    }`}
                  />
                  <button 
                    onClick={handleManualAddressSave}
                    disabled={isUpdatingLocation || !manualAddress}
                    className="px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 my-6">
                 <div className={`flex-1 h-[1px] ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">OR AUTO-DETECT</span>
                 <div className={`flex-1 h-[1px] ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}></div>
              </div>

              <button 
                onClick={handleUpdateRegisteredLocation}
                disabled={isUpdatingLocation}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
              >
                {isUpdatingLocation ? <Activity size={16} className="animate-spin" /> : <Navigation size={16} />}
                {isUpdatingLocation ? 'Syncing...' : 'Sync GPS Automatically'}
              </button>
            </div>

            <h3 className={`text-[10px] font-black uppercase tracking-[0.5em] pl-6 border-l ${theme === 'light' ? 'text-slate-400 border-slate-200' : 'text-slate-500 border-slate-800'}`}>Know Your Justice</h3>
            <div className="space-y-8 pl-6">
              <KnowYourRights context="general" className={`${theme === 'light' ? '!bg-white !border-slate-200 !text-slate-700' : '!bg-white/5 !border-white/10 !text-slate-200'}`} />
            </div>
          </div>
        </div>
      </div>

      <ProfileModel 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
      />

    </div>
  );
};;