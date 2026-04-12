import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth"; 
import { useNavigate } from "react-router-dom";
import { 
  FileText, Briefcase, Gavel, User, 
  ChevronRight, Globe, Search, ArrowUpRight, Shield, Clock, Scale
} from "lucide-react"; 

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  isProBono: boolean;
  assignedLawyer?: any; 
  filedBy?: any; 
}

export const Cases: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  const getID = (entity: any) => {
    if (!entity) return null;
    return typeof entity === 'string' ? entity : entity._id; 
  };

  const myUserId = user?.userId || user?._id || user?.id;

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCases(data);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (token) fetchCases();
  }, [token, myUserId]);

  const availableCases = cases.filter(c => !getID(c.assignedLawyer) && getID(c.filedBy) !== myUserId);
  const myCaseload = cases.filter(c => getID(c.assignedLawyer) === myUserId);
  const myFiledComplaints = cases.filter(c => getID(c.filedBy) === myUserId);

  const handleClaim = async (caseId: string) => {
    if(confirm("Accept representation for this case?")) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}/claim-lawyer`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) { window.location.reload(); }
        } catch (err) { console.error(err); }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#070b14]">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-[100] border-b border-white/5 bg-[#070b14]/80 backdrop-blur-2xl px-6 lg:px-12 py-4">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20"><Scale size={20} /></div>
            <h1 className="text-lg font-black text-white leading-tight tracking-tighter uppercase">Nyayasarthi <span className="text-indigo-500">Registry</span></h1>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'citizen' ? (
              <button onClick={() => navigate("/file-case")} className="px-6 py-2.5 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl">File New Complaint</button>
            ) : (
              <button onClick={() => navigate("/legal-notice")} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10">Broadcast Notice</button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto p-6 lg:p-12 space-y-16 pb-32">
        
        {/* PUBLIC OPPORTUNITIES */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <div className="w-1 h-8 bg-orange-500 rounded-full"></div>
              Public Node Registry
            </h2>
            <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">{availableCases.length} Available Nodes</div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/5 overflow-hidden">
            {availableCases.length === 0 ? (
              <div className="p-20 text-center opacity-50 font-black uppercase tracking-widest text-[10px]">Registry synchronized • No public requests</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Node Dossier</th>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocol Type</th>
                    <th className="px-10 py-8 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {availableCases.map((caseItem) => (
                    <tr key={caseItem._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="font-black text-white text-sm uppercase tracking-tight">{caseItem.title}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">#{caseItem.caseNumber}</div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-widest">{caseItem.type}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3">
                            <button onClick={() => navigate(`/case/${caseItem._id}`)} className="p-4 bg-white/5 text-slate-500 hover:bg-white hover:text-slate-950 rounded-2xl transition-all"><ChevronRight size={20}/></button>
                            {user?.role === 'lawyer' && (
                              <button onClick={() => handleClaim(caseItem._id)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700">Accept representation</button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* MY CASELOAD (Lawyer Only) */}
        {user?.role === 'lawyer' && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <div className="w-1 h-8 bg-indigo-500 rounded-full"></div>
              Active Assigned Files
            </h3>
            <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr>
                      <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">File Details</th>
                      <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Transmission State</th>
                      <th className="px-10 py-8 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {myCaseload.map(c => (
                      <tr key={c._id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-10 py-8">
                          <div className="font-black text-white text-sm uppercase tracking-tight">{c.title}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">ID: {c.caseNumber}</div>
                        </td>
                        <td className="px-10 py-8 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                          {c.status.replace('-', ' ')}
                        </td>
                        <td className="px-10 py-8 text-right">
                          <button onClick={() => navigate(`/case/${c._id}`)} className="p-4 bg-white/5 text-slate-500 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all group-hover:shadow-2xl group-hover:shadow-indigo-500/20"><ChevronRight size={20} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MY FILED COMPLAINTS */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <div className="w-1 h-8 bg-white rounded-full"></div>
            Personal Filing Audit
          </h3>
          <div className="bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/5">
                  <tr>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Complaint Node</th>
                    <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Resolution Signal</th>
                    <th className="px-10 py-8 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myFiledComplaints.map(c => (
                    <tr key={c._id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="font-black text-white text-sm uppercase tracking-tight">{c.title}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Node ID: {c.caseNumber}</div>
                      </td>
                      <td className="px-10 py-8">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${c.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10'}`}>{c.status}</span>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button onClick={() => navigate(`/case/${c._id}`)} className="p-4 bg-white/5 text-slate-500 hover:bg-white hover:text-slate-950 rounded-2xl transition-all group-hover:shadow-2xl"><ChevronRight size={20} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </section>

      </main>
    </div>
  );
};