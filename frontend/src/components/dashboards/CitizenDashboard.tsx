import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { FileText, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

interface Analytics {
  totalCases: number;
  casesByStatus: Record<string, number>;
  avgResolutionTime: string;
}

export const CitizenDashboard: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/citizen`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setAnalytics(await response.json());
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

     fetchAnalytics();
  }, [token]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const statusStats = [
    {
      label: 'Total Cases',
      value: analytics?.totalCases || 0,
      icon: FileText,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Filed',
      value: analytics?.casesByStatus['filed'] || 0,
      icon: FileText,
      color: 'bg-yellow-100 text-yellow-700',
    },
    {
      label: 'Under Investigation',
      value: analytics?.casesByStatus['under-investigation'] || 0,
      icon: Clock,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Resolved',
      value: analytics?.casesByStatus['resolved'] || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Citizen Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statusStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Case Resolution Time
        </h3>
        <p className="text-4xl font-bold text-blue-600">
          {analytics?.avgResolutionTime || 0} days
        </p>
        <p className="text-slate-600 mt-2">Average time to resolve a case</p>
      </div>
    </div>
  );
};
