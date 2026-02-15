import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth"; // Fixed Import Path
import { useNavigate } from "react-router-dom";
import { FileText, Briefcase, CheckCircle, ArrowRight, Gavel, Clock } from "lucide-react"; 

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  isProBono: boolean;
  assignedLawyer?: any; 
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
  const getAssignedId = (assignedLawyer: any) => {
    if (!assignedLawyer) return null;
    if (typeof assignedLawyer === 'string') return assignedLawyer;
    return assignedLawyer._id; 
  };

  const myUserId = user?.userId;

  // 1. Available Cases (No Lawyer Assigned)
  const availableCases = cases.filter(c => !getAssignedId(c.assignedLawyer));

  // 2. My Cases (Assigned to Me - REGARDLESS of status)
  const myCases = cases.filter(c => {
     const lawyerId = getAssignedId(c.assignedLawyer);
     return lawyerId === myUserId;
  });

  // --- ACTIONS ---
  const handleClaim = async (caseId: string) => {
    if(confirm("Accept this case? It will move to your 'My Cases' list.")) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}/claim-lawyer`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) window.location.reload();
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
              {user?.role === 'lawyer' ? 'Find new clients and manage your caseload.' : 'View all public legal cases.'}
            </p>
          </div>
          {user?.role === "citizen" && (
            <button onClick={() => navigate("/file-case")} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
              <FileText size={18} /> File New Complaint
            </button>
          )}
        </div>

        {/* --- SECTION 1: MY ASSIGNED CASES (Your "Missing" Cases will be here) --- */}
        {user?.role === 'lawyer' && myCases.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Briefcase className="text-blue-600" /> Your Assigned Cases
            </h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Case</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myCases.map(c => (
                      <tr key={c._id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          <div className="text-xs text-slate-500 font-mono">{c.caseNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                           {c.status === 'pending_lawyer' ? (
                              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                ⚠ Draft
                              </span>
                           ) : (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                <CheckCircle size={12}/> Active
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                             onClick={() => navigate(`/case/${c._id}`)}
                             className="text-blue-600 font-bold text-xs hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* --- SECTION 2: NEW OPPORTUNITIES (Available Cases) --- */}
        <div className="mb-8">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Gavel className="text-slate-400" /> New Case Opportunities
           </h3>
           
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             {availableCases.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No new cases available to accept.</div>
             ) : (
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
                    {availableCases.map((caseItem) => (
                      <tr key={caseItem._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{caseItem.title}</div>
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
                               className="text-slate-500 text-xs font-medium hover:text-slate-700 px-2"
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
                    ))}
                  </tbody>
                </table>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};