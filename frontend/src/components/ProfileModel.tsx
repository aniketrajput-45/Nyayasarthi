import React, { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Shield, Scale, Briefcase, User as UserIcon, Hash } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; 
}

export const ProfileModel: React.FC<ProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { theme } = useTheme();
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  const fetchFullProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') + '/api' || 'http://localhost:5000/api';
      const userId = user.id || user._id || user.userId;
      
      const res = await fetch(`${apiUrl}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setFullProfile(data);
      }
    } catch (error) {
      console.error("Failed to fetch full profile");
    }
  };

  // NEW: Fetch the complete profile from the database when the modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchFullProfile();
    }
  }, [isOpen, user]);

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    
    setUpdating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL?.replace('/api', '') + '/api' || 'http://localhost:5000/api';
        const userId = user.id || user._id || user.userId;

        // Get address from coordinates
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const geoData = await geoRes.json();
        const address = geoData.display_name;

        const res = await fetch(`${apiUrl}/users/${userId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ lat: latitude, lng: longitude, address })
        });

        if (res.ok) {
          alert("Location updated successfully");
          fetchFullProfile();
        }
      } catch (error) {
        alert("Failed to update location");
      } finally {
        setUpdating(false);
      }
    }, () => {
      alert("GPS Access Denied");
      setUpdating(false);
    });
  };

  if (!isOpen || !user) return null;

  // Use the full database profile if it's loaded, otherwise fallback to basic token user
  const displayUser = fullProfile || user;

  const getRoleConfig = (role: string) => {
    switch(role) {
      case 'police': return { icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'judge': return { icon: Scale, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
      case 'lawyer': return { icon: Briefcase, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      default: return { icon: UserIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    }
  };

  const getLocationLabel = (role: string) => {
    switch(role) {
      case 'police': return 'Assigned Police Station';
      case 'judge': return 'Court Assignment';
      case 'lawyer': return 'Registered Chamber/Court';
      default: return 'Registered Home Address';
    }
  };

  const getLocationValue = () => {
    if (displayUser.role === 'judge' && displayUser.courtAssignment) return displayUser.courtAssignment;
    return displayUser.address || 'Location not registered yet';
  };

  const config = getRoleConfig(displayUser.role);
  const RoleIcon = config.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`w-full max-w-md rounded-[2.5rem] border shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-500 ${
          theme === 'light' ? 'bg-white border-slate-200' : 
          theme === 'high-contrast' ? 'bg-black border-white' : 
          'bg-slate-900 border-white/10'
        }`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className={`p-8 relative overflow-hidden ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-950'}`}>
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12 scale-150 pointer-events-none">
            <RoleIcon size={120} />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${config.bg} ${config.color} ${config.border}`}>
                <RoleIcon size={28} />
              </div>
              <div>
                <h2 className={`text-2xl font-black tracking-tight uppercase ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {displayUser.fullName}
                </h2>
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] mt-1 ${config.color}`}>
                  {displayUser.role} Profile
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-500/10 hover:bg-red-500/20 hover:text-red-500 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <Mail className="text-slate-400" size={20} />
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email Address</p>
                <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{displayUser.email}</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <Phone className="text-slate-400" size={20} />
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Phone Number</p>
                <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{displayUser.phone || '+91 - Not Provided'}</p>
              </div>
            </div>

            {displayUser.role === 'citizen' && (
              <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <Hash className="text-slate-400" size={20} />
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aadhaar / Gov ID</p>
                  <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{displayUser.aadhaarNumber || displayUser.aadharNumber || 'XXXX-XXXX-XXXX'}</p>
                </div>
              </div>
            )}

            {displayUser.role === 'police' && (
              <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <Shield className="text-blue-500" size={20} />
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Badge Number</p>
                  <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{displayUser.badgeNumber || 'Not Assigned'}</p>
                </div>
              </div>
            )}

            {displayUser.role === 'lawyer' && (
              <div className={`p-4 rounded-2xl border flex items-center gap-4 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'}`}>
                <Briefcase className="text-emerald-500" size={20} />
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Bar Council License</p>
                  <p className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>{displayUser.licenseNumber || 'Not Verified'}</p>
                </div>
              </div>
            )}

            <div className={`p-5 rounded-2xl border flex items-start gap-4 ${theme === 'light' ? 'bg-indigo-50/50 border-indigo-100' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
              <MapPin className="text-indigo-500 mt-1 shrink-0" size={20} />
              <div>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">{getLocationLabel(displayUser.role)}</p>
                <p className={`text-sm font-bold leading-snug ${theme === 'light' ? 'text-slate-900' : 'text-slate-200'}`}>
                  {getLocationValue()}
                </p>
                {displayUser.lat && displayUser.lng && (
                   <p className="text-[8px] font-mono text-slate-500 mt-2">GPS: {displayUser.lat}, {displayUser.lng}</p>
                )}
                {(displayUser.role === 'police' || displayUser.role === 'lawyer') && (
                  <button 
                    onClick={handleUpdateLocation}
                    disabled={updating}
                    className={`mt-4 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                      theme === 'light' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30'
                    }`}
                  >
                    {updating ? 'SYCHRONIZING...' : 'UPDATE LIVE LOCATION'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};