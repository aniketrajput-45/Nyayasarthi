import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, MapPin, AlertCircle } from "lucide-react";

interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  priority: string;
}

export const Cases: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        return "bg-yellow-100 text-yellow-700";
      case "under-investigation":
        return "bg-blue-100 text-blue-700";
      case "in-court":
        return "bg-orange-100 text-orange-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return <div className="p-8">Loading cases...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            {user?.role === "citizen" ? "My Cases" : "Cases"}
          </h2>
          {user?.role === "citizen" && (
            <button
              onClick={() => navigate("/file-case")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              + File Case
            </button>
          )}
        </div>
        {cases.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {user?.role === "citizen"
                ? "No cases found. File your first case!"
                : "No cases assigned yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Case Number
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {cases.map((caseItem) => (
                    <tr key={caseItem._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-mono text-slate-900">
                        {caseItem.caseNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {caseItem.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">
                        {caseItem.type}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseItem.status)}`}
                        >
                          {caseItem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(caseItem.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => navigate(`/case/${caseItem._id}`)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
