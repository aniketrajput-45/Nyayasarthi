import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FileText, AlertCircle, CheckCircle, ArrowRight, Gavel, Clock } from "lucide-react"; 

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  isProBono: boolean;
  assignedLawyer?: any; // Can be string ID or populated Object
}

export const Cases: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) setCases(await response.json());
      } catch (err) {
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [token]);

  // --- HELPER: SAFELY GET LAWYER ID ---
  // This fixes the "Vanishing Case" bug by handling both Objects and Strings
  const getAssignedId = (assignedLawyer: any) => {
    if (!assignedLawyer) return null;
    if (typeof assignedLawyer === 'string') return assignedLawyer;
    return assignedLawyer._id; // If it's an object (populated)
  };

  const myUserId = user?.userId;

  // 1. Available Cases (Marketplace) - No lawyer assigned yet
  const availableCases = cases.filter(c => !getAssignedId(c.assignedLawyer));

  // 2. My Drafts (My Desk) - Assigned to me AND status is 'pending_lawyer'
  const myDrafts = cases.filter(c => {
     const lawyerId = getAssignedId(c.assignedLawyer);
     return lawyerId === myUserId && c.status === 'pending_lawyer';
  });

  // 3. My Active Cases (In Court) - Assigned to me AND status is NOT 'pending_lawyer'
  const myActiveCases = cases.filter(c => {
     const lawyerId = getAssignedId(c.assignedLawyer);
     return lawyerId === myUserId && c.status !== 'pending_lawyer';
  });

  // --- ACTIONS ---
  const handleClaim = async (caseId: string) => {
    if(confirm("Accept this case? It will move to your 'Drafts' for review.")) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}/claim-lawyer`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) window.location.reload();
        } catch (err) { console.error(err); }
    }
  };

  const handleSubmitToCourt = async (caseId: string) => {
    if(confirm("CONFIRM: Submit this case to the Judge?\n\nThis will officially start the statutory timer (BNSS).")) {
       try {
         const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}/submit-to-court`, {
           method: 'PUT',
           headers: { Authorization: `Bearer ${token}` }
         });
         if(res.ok) window.location.reload();
       } catch (err) { console.error(err); }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading registry...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Case Registry</h2>
            <p className="text-slate-500 mt-1">
              {user?.role === 'lawyer' ? 'Find new clients and manage your case filings.' : 'View all public legal cases.'}
            </p>
          </div>
          {user?.role === "citizen" && (
            <button onClick={() => navigate("/file-case")} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
              <FileText size={18} /> File New Complaint
            </button>
          )}
        </div>

        {/* --- SECTION 1: MY DRAFTS (LAWYER ONLY) --- */}
        {user?.role === 'lawyer' && myDrafts.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2 mb-4">
                <AlertCircle className="text-amber-600" /> Action Required: Your Drafts ({myDrafts.length})
              </h3>
              <p className="text-sm text-amber-700 mb-4">You have accepted these cases. Review them and submit to the Judge to start the legal process.</p>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {myDrafts.map(c => (
                  <div key={c._id} className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-amber-400">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-mono text-slate-400">{c.caseNumber}</span>
                       <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold uppercase">Draft</span>
                    </div>
                    <h4 className="font-bold text-slate-900 line-clamp-1" title={c.title}>{c.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-4 flex items-center gap-1">
                      <Clock size={12}/> Accepted today
                    </p>
                    
                    <div className="flex gap-2">
                      <button 
                         onClick={() => navigate(`/case/${c._id}`)}
                         className="flex-1 bg-slate-50 text-slate-600 py-2 rounded text-xs font-bold hover:bg-slate-100 border border-slate-200"
                      >
                        Details
                      </button>
                      <button 
                         onClick={() => handleSubmitToCourt(c._id)}
                         className="flex-1 bg-slate-900 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-800 shadow-sm"
                      >
                         Submit <ArrowRight size={12}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- SECTION 2: CASE MARKETPLACE (AVAILABLE) --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
             <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <Gavel size={18} className="text-slate-400"/>
               {user?.role === 'lawyer' ? 'New Case Opportunities' : 'Public Registry'}
             </h3>
             <span className="text-xs font-medium text-slate-400 bg-white px-2 py-1 rounded border">
               {availableCases.length} Available
             </span>
          </div>

          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Case Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {/* 1. AVAILABLE CASES */}
              {availableCases.length === 0 && myActiveCases.length === 0 ? (
                 <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                     No new cases available at the moment.
                   </td>
                 </tr>
              ) : (
                availableCases.map((caseItem) => (
                  <tr key={caseItem._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">{caseItem.title}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{caseItem.caseNumber}</div>
                    </td>
                    <td className="px-6 py-4 capitalize text-sm text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {caseItem.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold border border-blue-100 inline-flex items-center gap-1">
                          New Request
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button 
                           onClick={() => navigate(`/case/${caseItem._id}`)} 
                           className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 text-xs font-medium border border-transparent hover:border-slate-200"
                         >
                           View
                         </button>
                         {user?.role === 'lawyer' && (
                            <button onClick={() => handleClaim(caseItem._id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-sm transition-transform active:scale-95">
                              Accept Case
                            </button>
                         )}
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {/* 2. MY ACTIVE CASES (Shown as Read-Only Reference) */}
              {user?.role === 'lawyer' && myActiveCases.length > 0 && (
                 <>
                   <tr className="bg-slate-50/80 border-t-2 border-slate-100">
                     <td colSpan={4} className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                       Your Active Cases (Filed in Court)
                     </td>
                   </tr>
                   {myActiveCases.map((caseItem) => (
                     <tr key={caseItem._id} className="bg-slate-50/30 opacity-75 hover:opacity-100 transition-opacity">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-600">{caseItem.title}</div>
                          <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium mt-0.5"><CheckCircle size={10}/> Assigned to you</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">{caseItem.type}</td>
                        <td className="px-6 py-4"><span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">Processing</span></td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => navigate(`/case/${caseItem._id}`)} className="text-blue-600 text-xs font-bold hover:underline">View Progress</button>
                        </td>
                     </tr>
                   ))}
                 </>
              )}

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};