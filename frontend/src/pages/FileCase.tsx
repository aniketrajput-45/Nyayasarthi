import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle } from "lucide-react";

const caseTypes = [
  "civil",
  "criminal",
  "commercial",
  "family",
  "property",
  "other",
];

export const FileCase: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "civil",
    location: "",
    incidentDate: "",
    isProBono: false, // Add this new field to the form data
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/cases/file`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to file case");
      }

      setSuccess(true);
      setTimeout(() => navigate("/my-cases"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error filing case");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Case Filed Successfully
          </h2>
          <p className="text-slate-600 mb-6">
            Your case has been registered. You will be redirected to your cases.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          File a New Case
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Case Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief title of your case"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Case Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {caseTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of your case"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Location of incident"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date of Incident *
            </label>
            <input
              type="date"
              name="incidentDate"
              value={formData.incidentDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex items-center gap-2 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <input
              type="checkbox"
              name="isProBono"
              checked={formData.isProBono}
              onChange={handleChange}
              id="proBono"
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="proBono" className="text-sm text-slate-700">
              <span className="font-bold text-slate-900">
                Request Pro Bono (Free Legal Aid)
              </span>
              <p className="text-xs text-slate-500">
                Check this if you cannot afford a lawyer. Eligible lawyers may
                accept your case for free.
              </p>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition"
          >
            {loading ? "Filing Case..." : "File Case"}
          </button>
        </form>
      </div>
    </div>
  );
};
