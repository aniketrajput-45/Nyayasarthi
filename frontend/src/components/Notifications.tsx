import React, { useEffect, useState } from 'react';
import { Bell, X, Check, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

interface NotificationItem {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

export const Notifications: React.FC = () => {
  const { token } = useAuth();
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: NotificationItem) => !n.read).length);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'alert': return <ShieldAlert size={16} className="text-red-500" />;
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
      default: return <Info size={16} className="text-orange-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all duration-500 group ${
          isOpen 
            ? (theme === 'light' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-950 shadow-[0_0_30px_rgba(255,255,255,0.2)]')
            : (theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-white/5 hover:bg-white/10 text-slate-300')
        }`}
      >
        <div className="relative">
          <Bell size={20} className={`transition-transform duration-500 ${unreadCount > 0 ? 'animate-swing' : 'group-hover:rotate-12'}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#070b14] shadow-2xl animate-in zoom-in-50 duration-500 px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[110]" onClick={() => setIsOpen(false)} />
          <div className={`absolute right-0 mt-4 w-80 md:w-96 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[120] border transition-all duration-500 animate-in slide-in-from-top-4 fade-in zoom-in-95 overflow-hidden ${
            theme === 'light' ? 'bg-white border-slate-200' : 
            theme === 'high-contrast' ? 'bg-black border-white' : 
            'bg-[#0a0f1d]/95 backdrop-blur-2xl border-white/10'
          }`}>
            <div className={`p-6 flex items-center justify-between border-b ${
              theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'
            }`}>
              <div>
                <h3 className={`font-black uppercase tracking-tighter text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Intelligence Feed</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Tactical Notifications</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={18}/></button>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No active signals</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <div 
                      key={n._id} 
                      className={`p-5 transition-all duration-300 flex gap-4 group ${
                        !n.read 
                          ? (theme === 'light' ? 'bg-indigo-50/50' : 'bg-indigo-500/5') 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                        theme === 'light' ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'
                      }`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed font-medium transition-colors ${
                          !n.read ? (theme === 'light' ? 'text-slate-900' : 'text-white') : 'text-slate-400'
                        }`}>
                          {n.message}
                        </p>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • TRANSMISSION SECURE
                        </p>
                      </div>
                      {!n.read && (
                        <button 
                          onClick={() => markAsRead(n._id)}
                          className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all self-center shadow-lg"
                          title="Mark as Read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className={`p-4 border-t text-center ${
                theme === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'
              }`}>
                <button 
                  onClick={async () => {
                    const apiUrl = getApiUrl();
                    await fetch(`${apiUrl}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
                    fetchNotifications();
                  }}
                  className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] hover:underline"
                >
                  Purge Unread Buffer
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};