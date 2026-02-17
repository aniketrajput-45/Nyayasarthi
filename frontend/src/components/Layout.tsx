import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Outlet } from 'react-router-dom';
import { Menu, X, LogOut, MessageSquare, Home, FileText, BarChart3 } from 'lucide-react';
import { Chatbot } from './Chatbot'; // <-- ADDED: Import the Chatbot

const navigationItems = {
  citizen: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'File Case', path: '/file-case', icon: FileText },
    { label: 'My Cases', path: '/my-cases', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
  ],
  police: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Cases', path: '/cases', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
  ],
  lawyer: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Cases', path: '/cases', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
  ],
  judge: [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Cases', path: '/cases', icon: FileText },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Chat', path: '/chat', icon: MessageSquare },
  ],
};

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = navigationItems[user?.role as keyof typeof navigationItems] || [];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Justice Hub</h1>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition text-left"
                title={item.label}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          {sidebarOpen && (
            <>
              <p className="text-xs text-slate-400 uppercase font-semibold">Account</p>
              <p className="text-sm text-slate-300">{user?.fullName}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition mt-4"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>

      {/* <-- ADDED: Chatbot component rendered here --> */}
      <Chatbot />
    </div>
  );
};