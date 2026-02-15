import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth"; 
import { useNavigate } from "react-router-dom";
import { FileText, Briefcase, Gavel, User } from "lucide-react"; 

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

  // --- HELPER 1: Get ID from an entity (populated object or string ID) ---
  const getID = (entity: any) => {
    if (!entity) return null;
    return typeof entity === 'string' ? entity : entity._id; 
  };

  // --- HELPER 2: Get Current User ID safely ---
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
      } catch (err) {
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCases();
  }, [token, myUserId]);


  // 1. Available: Not assigned AND not filed by me
  const availableCases = cases.filter(c => 
    !getID(c.assignedLawyer) && getID(c.filedBy) !== myUserId
  );

  // 2. My Caseload: Assigned to me
  const myCaseload = cases.filter(c => 
    getID(c.assignedLawyer) === myUserId
  );

  // 3. My Filed Complaints: Filed by me
  const myFiledComplaints = cases.filter(c => 
    getID(c.filedBy) === myUserId
  );

  const handleClaim = async (caseId: string) => {
    if(confirm("Accept this case? It will move to your 'My Cases' list.")) {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/cases/${caseId}/claim-lawyer`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            window.location.reload();
          } else {
            alert("Failed to claim case.");
          }
        } catch (err) { console.error(err); }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading registry...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Case Registry</h2>
            <p className="text-slate-500 mt-1">Manage your legal portfolio.</p>
          </div>
          {/* Show File Button for Everyone */}
          <button onClick={() => navigate("/file-case")} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition">
            <FileText size={18} /> File New Complaint
          </button>
        </div>

        {/* --- SECTION 1: NEW OPPORTUNITIES (MOVED TO TOP) --- */}
        <div className="mb-12">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Gavel className="text-slate-400" /> Public Opportunities ({availableCases.length})
            </h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {availableCases.length === 0 ? (
                <div className="p-8 text-center text-slate-500 italic">No new cases available.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Case Info</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {availableCases.map((caseItem) => (
                      <tr key={caseItem._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{caseItem.title}</div>
                          <div className="text-xs text-slate-500 font-mono">{caseItem.caseNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 capitalize">{caseItem.type}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                              <button onClick={() => navigate(`/case/${caseItem._id}`)} className="text-slate-500 text-xs font-medium px-2">View</button>
                              {user?.role === 'lawyer' && (
                                <button onClick={() => handleClaim(caseItem._id)} className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-indigo-700">Accept Case</button>
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

        {/* --- SECTION 2: MY ACTIVE CASELOAD (Lawyer Only) --- */}
        {user?.role === 'lawyer' && (
          <div className="mb-12">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Briefcase className="text-blue-600" /> My Active Caseload ({myCaseload.length})
            </h3>
            {myCaseload.length === 0 ? <p className="text-slate-400 italic">No active cases assigned.</p> : (
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
                      {myCaseload.map(c => (
                        <tr key={c._id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{c.title}</div>
                            <div className="text-xs text-slate-500 font-mono">{c.caseNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => navigate(`/case/${c._id}`)} className="text-blue-600 font-bold text-xs hover:underline">View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- SECTION 3: MY FILED COMPLAINTS --- */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
            <User className="text-indigo-600" /> My Filed Complaints ({myFiledComplaints.length})
          </h3>
          {myFiledComplaints.length === 0 ? <p className="text-slate-400 italic">You haven't filed any cases.</p> : (
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
                    {myFiledComplaints.map(c => (
                      <tr key={c._id} className="hover:bg-indigo-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{c.title}</div>
                          <div className="text-xs text-slate-500 font-mono">{c.caseNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold uppercase">{c.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => navigate(`/case/${c._id}`)} className="text-indigo-600 font-bold text-xs hover:underline">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};