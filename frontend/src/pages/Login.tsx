import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { 
  Mail, Lock, AlertCircle, Shield, 
  ArrowRight, Sparkles, Key,
  Sun, Moon, Eye
} from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
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
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 grayscale"></div>
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
            <h2 className="text-5xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter uppercase">Resume Your <br/><span className={theme === 'light' ? 'text-orange-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600'}>Judicial Session</span></h2>
            <p className={`${theme === 'light' ? 'text-indigo-50' : 'text-slate-400'} font-medium text-lg max-w-sm leading-relaxed`}>Securely access your case files, evidence locker, and real-time dispatch signals.</p>
          </div>

          <div className="space-y-6">
            {[
              { text: 'Biometric Handshake Protocol', icon: Key },
              { text: 'Justice Node Authentication', icon: Sparkles },
              { text: 'Restricted Multi-Factor Access', icon: Shield }
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
        {/* Mobile Logo */}
        <div className="md:hidden mb-12 flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20"><Shield size={24}/></div>
           <h1 className="text-xl font-black text-white uppercase tracking-tighter">Nyayasarthi</h1>
        </div>

        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="space-y-2 text-center md:text-left">
            <h3 className={`text-3xl font-black uppercase tracking-tighter flex items-center gap-4 justify-center md:justify-start ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
              Node Authentication
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Enter your credentials to establish a secure uplink</p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[1.5rem] flex items-start gap-4 animate-in shake duration-500">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs font-bold uppercase tracking-wide leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Email Identity</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    theme === 'light' ? 'text-slate-400 group-focus-within:text-indigo-600' : 'text-slate-600 group-focus-within:text-indigo-500'
                  }`} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className={`w-full pl-12 pr-4 py-4 border transition-all outline-none font-bold text-sm rounded-2xl ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' : 
                      theme === 'high-contrast' ? 'bg-black border-white text-white focus:bg-zinc-900' :
                      'bg-white/5 border-white/10 text-white focus:bg-white/10 focus:border-indigo-500'
                    }`}
                    placeholder="EMAIL@NYAYA.GOV"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Access Key</label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                    theme === 'light' ? 'text-slate-400 group-focus-within:text-indigo-600' : 'text-slate-600 group-focus-within:text-indigo-500'
                  }`} />
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className={`w-full pl-12 pr-4 py-4 border transition-all outline-none font-bold rounded-2xl ${
                      theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-600' : 
                      theme === 'high-contrast' ? 'bg-black border-white text-white focus:bg-zinc-900' :
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
                <>Establish Uplink <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="pt-10 text-center">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              No active session? {' '}
              <Link to="/register" className="text-indigo-500 hover:text-indigo-400 transition-colors underline-offset-8 underline ml-2">
                Initialize Registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};