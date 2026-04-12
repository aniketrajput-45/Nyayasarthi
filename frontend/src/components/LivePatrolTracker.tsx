import React, { useEffect, useState } from 'react';
import { Shield, MapPin, Navigation, Phone, MessageSquare, AlertCircle, Clock, ArrowUpRight } from 'lucide-react';

interface PatrolTrackerProps {
  onCancel: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  isMinimized: boolean;
  userLocation: string;
}

export const LivePatrolTracker: React.FC<PatrolTrackerProps> = ({ 
  onCancel, 
  onMinimize, 
  onExpand, 
  isMinimized, 
  userLocation 
}) => {
  const [progress, setProgress] = useState(0);
  const [estimatedArrival, setExtimatedArrival] = useState(5);
  const [status, setStatus] = useState('Dispatching Unit...');

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('Unit Arrived at Scene');
          return 100;
        }
        if (prev > 80) setStatus('Unit Approaching Your Location');
        else if (prev > 40) setStatus('Unit En Route (HSR Layout)');
        else if (prev > 10) setStatus('Patrol PCR-42 Assigned');
        
        return prev + 1;
      });
    }, 1000);

    const timer = setInterval(() => {
      setExtimatedArrival((prev) => (prev > 1 ? prev - 1 : 1));
    }, 20000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

  if (isMinimized) {
    return (
      <div 
        onClick={onExpand}
        className="fixed bottom-8 right-8 z-[300] bg-red-600 text-white p-4 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] border border-red-400/30 flex items-center gap-4 cursor-pointer hover:scale-105 transition-all group animate-bounce"
      >
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center relative">
          <Navigation size={20} className="fill-current animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
        </div>
        <div className="pr-2">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">PCR-42 En Route</p>
          <p className="text-xs font-black uppercase tracking-tight">SOS Active • {estimatedArrival}m Away</p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ArrowUpRight size={16} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4 md:p-10 animate-in fade-in duration-500">
      <div className="bg-white rounded-[40px] shadow-2xl border border-white/20 max-w-2xl w-full overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-700">
        
        {/* HEADER */}
        <div className="bg-red-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <Shield size={150} />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
                <Navigation size={24} className="fill-current" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">Emergency Dispatch</h2>
                <p className="text-red-100 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Live Tracking Active • Case #SOS-911</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-red-100 text-[10px] font-black uppercase tracking-widest">Est. Arrival</p>
              <p className="text-3xl font-black">{estimatedArrival}m</p>
            </div>
          </div>
        </div>

        {/* MAP SIMULATION */}
        <div className="flex-1 bg-slate-100 relative h-80 overflow-hidden">
          {/* Radar Waves */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border border-blue-400/30 rounded-full animate-ping"></div>
            <div className="absolute w-96 h-96 border border-blue-400/20 rounded-full animate-ping [animation-delay:0.5s]"></div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-10 grid-rows-8 gap-4 opacity-5 absolute inset-0 p-4">
            {Array.from({ length: 80 }).map((_, i) => (
              <div key={i} className="aspect-square border border-slate-900 border-dashed" />
            ))}
          </div>

          {/* Path Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <path 
              d="M 100 300 Q 250 150 500 50" 
              stroke="rgba(59, 130, 246, 0.2)" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray="8 8"
            />
            <path 
              d="M 100 300 Q 250 150 500 50" 
              stroke="#2563EB" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDashoffset={400 - (progress * 4)}
              strokeDasharray="400"
            />
          </svg>

          {/* User Marker */}
          <div className="absolute bottom-[20%] left-[15%] flex flex-col items-center">
            <div className="w-4 h-4 bg-red-600 rounded-full shadow-[0_0_20px_rgba(220,38,38,1)] animate-bounce" />
            <div className="mt-2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-xl border border-white/10 uppercase">You: {userLocation}</div>
          </div>

          {/* Patrol Unit Marker */}
          <div 
            className="absolute transition-all duration-1000 ease-linear"
            style={{ 
              bottom: `${20 + (progress * 0.6)}%`, 
              left: `${15 + (progress * 0.65)}%` 
            }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white rotate-45">
                <Navigation size={20} className="text-white -rotate-45" />
              </div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full shadow-xl whitespace-nowrap uppercase tracking-widest border border-blue-400">
                Patrol PCR-42
              </div>
            </div>
          </div>
        </div>

        {/* STATUS & ACTIONS */}
        <div className="p-8 space-y-8 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{status}</p>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}% Traversed</p>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
              <Phone size={16} /> Call Dispatch
            </button>
            <button 
               onClick={onCancel}
               className="flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
            >
              <AlertCircle size={16} /> Cancel SOS
            </button>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
              Stay in a safe, well-lit area. If your situation changes, use the "Call Dispatch" button immediately. Your location is being broadcasted securely.
            </p>
          </div>

          <button 
            onClick={onMinimize}
            className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors pt-2"
          >
            Minimize Tracking View
          </button>
        </div>
      </div>
    </div>
  );
};