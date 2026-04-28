import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  Mail, Lock, User, AlertCircle, Shield, 
  Phone, Fingerprint, Gavel, Briefcase, 
  CheckCircle2, ArrowRight, Sparkles,
  Sun, Moon, Eye
} from 'lucide-react';

const roles = [
  { id: 'citizen', label: 'Citizen', description: 'Legal Rights & SOS', icon: User },
  { id: 'police', label: 'Police', description: 'Investigation Hub', icon: Shield },
  { id: 'lawyer', label: 'Lawyer', description: 'Advocate Chambers', icon: Briefcase },
  { id: 'judge', label: 'Judge', description: 'Judicial Chambers', icon: Gavel },
];

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [courtAssignment, setCourtAssignment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleCaptureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await res.json();
            if (data.display_name) setAddress(data.display_name);
          } catch (e) {}
        },
        () => setError('GPS Access Denied')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
  try {
    await register(
      email, 
      password, 
      fullName, 
      role,
      phone,
      aadhaarNumber,
      badgeNumber,
      licenseNumber,
      courtAssignment,
      specialization,
      address,
      coords?.lat,
      coords?.lng
    );
    navigate('/dashboard');
  } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row overflow-x-hidden transition-colors duration-500 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900' : 
      theme === 'high-contrast' ? 'bg-black text-white' : 
      'bg-[#070b14] text-slate-300'
    }`}>
      
      {/* Theme Toggle Floating */}
      <button 
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-[100] p-3 rounded-2xl border transition-all flex items-center gap-2 shadow-2xl ${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : 
          theme === 'high-contrast' ? 'bg-zinc-900 border-white text-white hover:bg-zinc-800' : 
          'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
        }`}
      >
        {theme === 'dark' && <Moon size={20} />}
        {theme === 'light' && <Sun size={20} />}
        {theme === 'high-contrast' && <Eye size={20} />}
      </button>

      {/* LEFT SIDE: BRANDING/VISUAL */}
      <div className={`hidden md:flex md:w-[40%] lg:w-[45%] relative overflow-hidden flex-col justify-between p-12 lg:p-20 border-r transition-colors duration-500 ${
        theme === 'light' ? 'bg-indigo-600 border-indigo-500' : 
        theme === 'high-contrast' ? 'bg-black border-white' : 
        'bg-[#0a0f1d] border-white/5'
      }`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 grayscale group-hover:scale-105 transition-transform duration-1000"></div>
        <div className={`absolute inset-0 bg-gradient-to-b ${
          theme === 'light' ? 'from-indigo-700/50 via-transparent to-indigo-700/50' : 
          'from-[#070b14] via-transparent to-[#070b14]'
        }`}></div>
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex flex-wrap w-[40px] h-[40px] gap-[4px] rotate-45 group-hover:rotate-0 transition-all duration-700">
            <div className="w-[18px] h-[18px] bg-orange-600 rounded-sm shadow-[0_0_15px_rgba(234,88,12,0.5)]"></div>
            <div className="w-[18px] h-[18px] bg-indigo-600 rounded-sm"></div>
            <div className="w-[18px] h-[18px] bg-indigo-400 rounded-sm"></div>
            <div className={`w-[18px] h-[18px] bg-transparent rounded-sm border ${theme === 'light' ? 'border-white/40' : 'border-white/10'}`}></div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white leading-none tracking-tighter uppercase">Nyayasarthi</h1>
            <p className={`${theme === 'light' ? 'text-indigo-100' : 'text-indigo-400'} font-bold text-[10px] uppercase tracking-[0.4em] mt-1`}>Digital Justice infrastructure</p>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-10">
          <div className="space-y-4">
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter uppercase">Secure Your <br/><span className={theme === 'light' ? 'text-orange-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600'}>Legal Identity</span></h2>
            <p className={`${theme === 'light' ? 'text-indigo-50' : 'text-slate-400'} font-medium text-lg max-w-sm leading-relaxed`}>Join the centralized network for swift judicial action and real-time tracking.</p>
          </div>

          <div className="space-y-6">
            {[
              { text: 'AES-256 Encrypted Vault', icon: Lock },
              { text: 'Real-time Emergency Dispatch', icon: Shield },
              { text: 'BNSS Statutory Compliance', icon: Gavel }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 text-white">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xl border ${
                  theme === 'light' ? 'bg-white/10 border-white/20 text-orange-400' : 'bg-white/5 border-white/10 text-indigo-400'
                }`}>
                  <item.icon size={18} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-indigo-200' : 'text-slate-500'}`}>© 2026 Ministry of Digital Justice • V 2.4.0</p>
        </div>
      </div>

      {/* RIGHT SIDE: FORM */}
      <div className={`flex-1 flex flex-col items-center justify-center p-6 lg:p-20 relative transition-colors duration-500 ${
        theme === 'light' ? 'bg-white' : 
        theme === 'high-contrast' ? 'bg-black' : 
        'bg-[#070b14]'
      }`}>
        <div className="w-full max-w-xl space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
          <div className="space-y-2">
            <h3 className={`text-3xl font-black uppercase tracking-tighter flex items-center gap-4 ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
              Node Registration
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Initialize your judicial credentials to access the platform</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake duration-500">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs font-bold uppercase tracking-wide leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Identity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { label: 'Full Name', icon: User, val: fullName, set: setFullName, type: 'text', ph: 'ENTER FULL NAME' },
                { label: 'Email Node', icon: Mail, val: email, set: setEmail, type: 'email', ph: 'EMAIL@NYAYA.GOV' },
                { label: 'Secure Mobile', icon: Phone, val: phone, set: setPhone, type: 'text', ph: '+91 00000 00000' },
                { label: 'Aadhaar (UIDAI)', icon: Fingerprint, val: aadhaarNumber, set: setAadhaarNumber, type: 'text', ph: '0000 0000 0000' }
              ].map((field, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">{field.label}</label>
                  <div className="relative group">
                    <field.icon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      theme === 'light' ? 'text-slate-400 group-focus-within:text-indigo-600' : 'text-slate-600 group-focus-within:text-indigo-500'
                    }`} />
                    <input
                      type={field.type} value={field.val} onChange={(e) => field.set(e.target.value)} required
                      className={`w-full pl-12 pr-4 py-4 border transition-all outline-none font-bold text-sm uppercase tracking-wider rounded-2xl ${
                        theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' : 
                        theme === 'high-contrast' ? 'bg-black border-white text-white focus:bg-zinc-900' :
                        'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-indigo-500'
                      }`}
                      placeholder={field.ph}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Role Tactical Selection */}
            <div className="space-y-4 pt-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Access Role Allocation</label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {roles.map((r) => (
                  <label key={r.id} className="cursor-pointer group">
                    <input
                      type="radio" name="role" value={r.id} checked={role === r.id}
                      onChange={(e) => {
                        setRole(e.target.value);
                        if(e.target.value !== 'lawyer') setSpecialization('');
                      }} className="sr-only"
                    />
                    <div className={`p-4 rounded-2xl border-2 transition-all duration-500 flex flex-col items-center gap-2 text-center h-full ${
                      role === r.id
                        ? (theme === 'light' ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100' : 'border-indigo-600 bg-indigo-600/10 shadow-[0_0_30px_rgba(79,70,229,0.2)]')
                        : (theme === 'light' ? 'border-slate-100 bg-slate-50 hover:border-slate-200' : 'border-white/5 bg-white/5 hover:border-white/20')
                    }`}>
                      <r.icon size={20} className={role === r.id ? 'text-indigo-500' : 'text-slate-400'} />
                      <p className={`font-black text-[10px] uppercase tracking-tighter ${
                        role === r.id ? (theme === 'light' ? 'text-indigo-700' : 'text-white') : 'text-slate-500'
                      }`}>{r.label}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Credentials */}
            {(role === 'police' || role === 'lawyer' || role === 'judge') && (
              <div className={`p-8 rounded-[2rem] border animate-in zoom-in-95 duration-500 ${
                theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-600/5 border border-indigo-500/20'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles size={16} className="text-indigo-500" />
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Statutory Verification Required</span>
                </div>
                
                <div className="space-y-6">
                  {role === 'police' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Badge Number</label>
                        <input
                          type="text" value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} required
                          className={`w-full px-6 py-4 border rounded-2xl outline-none font-bold text-sm uppercase tracking-widest ${
                            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600' : 
                            'bg-[#070b14] border-white/10 text-white focus:border-indigo-500'
                          }`}
                          placeholder="POL-00000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Station Coordinates</label>
                        <button
                          type="button" onClick={handleCaptureLocation}
                          className={`w-full px-6 py-4 border rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                            coords 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                              : (theme === 'light' ? 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-600' : 'bg-[#070b14] border-white/10 text-indigo-400 hover:border-indigo-500')
                          }`}
                        >
                          {coords ? <CheckCircle2 size={16}/> : <MapPin size={16}/>}
                          {coords ? 'LOCATION SECURED' : 'CAPTURE STATION GPS'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Shared Address/Station Field for all Official Roles */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">
                      {role === 'police' ? 'Station Address' : role === 'judge' ? 'Chambers/Court Address' : 'Office Address'}
                    </label>
                    <input
                      type="text" value={address} onChange={(e) => setAddress(e.target.value)} required
                      className={`w-full px-6 py-4 border rounded-2xl outline-none font-bold text-sm uppercase tracking-widest ${
                        theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600' : 
                        'bg-[#070b14] border-white/10 text-white focus:border-indigo-500'
                      }`}
                      placeholder="ENTER FULL PHYSICAL ADDRESS"
                    />
                  </div>
                  {role === 'lawyer' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Bar License UID</label>
                        <input
                          type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required
                          className={`w-full px-6 py-4 border rounded-2xl outline-none font-bold text-sm uppercase tracking-widest ${
                            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600' : 
                            'bg-[#070b14] border-white/10 text-white focus:border-indigo-500'
                          }`}
                          placeholder="BAR/2026/000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Specialization</label>
                        <select
                          value={specialization} onChange={(e) => setSpecialization(e.target.value)} required
                          className={`w-full px-6 py-4 border rounded-2xl outline-none font-bold text-sm uppercase tracking-widest cursor-pointer appearance-none ${
                            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600' : 
                            'bg-[#070b14] border-white/10 text-white focus:border-indigo-500'
                          }`}
                        >
                          <option value="">Select Domain...</option>
                          <option value="criminal">Criminal Law</option>
                          <option value="civil">Civil Litigation</option>
                          <option value="cyber">Cyber Security</option>
                          <option value="family">Family Matters</option>
                          <option value="corporate">Corporate Law</option>
                          <option value="commercial">Commercial Law</option>
                          <option value="property">Property Law</option>
                          <option value="general">General Practice</option>                        </select>
                      </div>
                    </div>
                  )}
                  {role === 'judge' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Court Assignment Node</label>
                      <input
                        type="text" value={courtAssignment} onChange={(e) => setCourtAssignment(e.target.value)} required
                        className={`w-full px-6 py-4 border rounded-2xl outline-none font-bold text-sm uppercase tracking-wider ${
                          theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-indigo-600' : 
                          'bg-[#070b14] border-white/10 text-white focus:border-indigo-500'
                        }`}
                        placeholder="E.G. HIGH COURT KARNATAKA"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Access Password</label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    theme === 'light' ? 'text-slate-400 group-focus-within:text-indigo-600' : 'text-slate-600 group-focus-within:text-indigo-500'
                  }`} />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className={`w-full pl-12 pr-4 py-4 border rounded-2xl outline-none font-bold ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' : 
                      'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-indigo-500'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Confirm Node Key</label>
                <div className="relative group">
                  <CheckCircle2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    theme === 'light' ? 'text-slate-400 group-focus-within:text-emerald-600' : 'text-slate-600 group-focus-within:text-emerald-500'
                  }`} />
                  <input
                    type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    className={`w-full pl-12 pr-4 py-4 border rounded-2xl outline-none font-bold ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' : 
                      'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-indigo-500'
                    }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 group shadow-2xl ${
                theme === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 
                'bg-white text-slate-950 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Initialize Account <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="pt-10 text-center pb-10">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Already authenticated? {' '}
              <Link to="/login" className="text-indigo-500 hover:text-indigo-400 transition-colors underline-offset-8 underline ml-2">
                Sign in to Node
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};