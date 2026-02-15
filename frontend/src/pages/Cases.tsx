import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FileText, AlertCircle, Heart, Download, Shield } from "lucide-react";
import { AssignModal } from "../components/AssignModal";
// If you opted for the simple PDF fix, keep this import.
// If you removed the file, comment this out and use the inline function I gave earlier.
import { generateFIR } from "../utils/generatePDF";

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  priority: string;
  isProBono: boolean; // This is the key field
  assignedLawyer?: string;
  assignedPolice?: string;
}

export const Cases: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState("");

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          setCases(await response.json());
        } else {
          setError("Failed to fetch cases");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching cases");
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "filed":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "under-investigation":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "in-court":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "resolved":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-red-600 flex gap-2">
        <AlertCircle /> {error}
      </div>
    );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {user?.role === "citizen" ? "My Cases" : "Case Management"}
            </h2>
            <p className="text-slate-500 mt-1">
              Manage and track all legal proceedings
            </p>
          </div>

          {user?.role === "citizen" && (
            <button
              onClick={() => navigate("/file-case")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
            >
              <FileText size={18} /> File New Case
            </button>
          )}
        </div>

        {cases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">
              No cases found
            </h3>
            <p className="text-slate-500 mt-1">
              {user?.role === "citizen"
                ? "Get started by filing a new case."
                : "No cases have been assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Case No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Title & Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((caseItem) => {
                  // --- VISUAL LOGIC START ---
                  const isProBono = caseItem.isProBono;
                  const rowClass = isProBono
                    ? "bg-purple-50 border-l-4 border-l-purple-600" // Purple Row & Thick Border
                    : "hover:bg-slate-50 border-l-4 border-l-transparent"; // Normal Row
                  // --- VISUAL LOGIC END ---

                  return (
                    <tr
                      key={caseItem._id}
                      className={`transition-all ${rowClass}`}
                    >
                      {/* Case Number Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`font-mono text-sm ${isProBono ? "text-purple-700 font-bold" : "text-slate-600"}`}
                        >
                          {caseItem.caseNumber || "PENDING"}
                        </div>
                      </td>

                      {/* Title Column with ICON */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex-shrink-0 ${isProBono ? "text-pink-600" : "text-slate-400"}`}
                          >
                            {/* IF PRO BONO: Show Heart. ELSE: Show File */}
                            {isProBono ? (
                              <Heart size={20} fill="currentColor" />
                            ) : (
                              <FileText size={20} />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {caseItem.title}
                            </div>
                            {isProBono && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-pink-100 text-pink-800 mt-1">
                                ✨ Pro Bono Case
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {caseItem.type}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(caseItem.status)}`}
                        >
                          {caseItem.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          {/* VIEW BUTTON */}
                          <button
                            onClick={() => navigate(`/case/${caseItem._id}`)}
                            className="text-slate-600 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
                            title="View Details"
                          >
                            <FileText size={18} />
                          </button>

                          {/* DOWNLOAD PDF BUTTON */}
                          <button
                            onClick={() => generateFIR(caseItem)}
                            className="text-slate-600 hover:text-green-600 p-2 hover:bg-green-50 rounded-full transition-colors"
                            title="Download FIR"
                          >
                            <Download size={18} />
                          </button>

                          {/* LAWYER ACTION: Accept ANY Unassigned Case */}
                          {user?.role === "lawyer" &&
                            !caseItem.assignedLawyer && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    confirm(
                                      `Are you sure you want to represent the client in "${caseItem.title}"?`,
                                    )
                                  ) {
                                    await fetch(
                                      `${import.meta.env.VITE_API_URL}/cases/${caseItem._id}/claim-lawyer`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    window.location.reload();
                                  }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded shadow-sm ml-2 flex items-center gap-1"
                              >
                                {caseItem.isProBono
                                  ? "Accept Pro Bono"
                                  : "Accept Client"}
                              </button>
                            )}
                          {/* JUDGE ASSIGN BUTTON */}
                          {user?.role === "judge" && (
                            <button
                              onClick={() => {
                                setSelectedCaseId(caseItem._id);
                                setAssignModalOpen(true);
                              }}
                              className="text-purple-600 hover:text-purple-700 font-medium text-sm ml-2 px-3 py-1 bg-purple-50 rounded hover:bg-purple-100"
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        caseId={selectedCaseId}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};
