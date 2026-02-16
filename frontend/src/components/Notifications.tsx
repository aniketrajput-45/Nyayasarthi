import React, { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NotificationItem {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const Notifications: React.FC = () => {
  const { token, user } = useAuth(); // Get user info too
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      console.log("🔔 Fetching notifications for User:", user?.userId || user?._id); // DEBUG 1

      const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("🔔 Notifications Received:", data); // DEBUG 2
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      } else {
        console.error("🔔 Fetch Error:", res.status); // DEBUG 3
      }
    } catch (err) { 
      console.error("🔔 Network Error:", err); 
    }
  };

  // Poll every 5 seconds
  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const markRead = async (id: string) => {
    await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-700">Notifications</h3>
            {unreadCount > 0 && (
               <button onClick={fetchNotifications} className="text-xs text-blue-600 hover:underline">Refresh</button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">No new notifications</p>
            ) : (
              notifications.map(n => (
                <div key={n._id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 transition ${n.read ? 'opacity-60' : 'bg-blue-50/30'}`}>
                  <div className="flex gap-2 items-start">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="text-xs text-slate-800 font-medium leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                    </div>
                    {!n.read && (
                      <button onClick={() => markRead(n._id)} className="text-slate-400 hover:text-blue-600">
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};