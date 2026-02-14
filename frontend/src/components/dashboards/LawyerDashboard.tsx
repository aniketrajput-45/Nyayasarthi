import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Briefcase, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface LawyerDashboardData {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  winRate: string;
  casesByType: Record<string, number>;
}

export const LawyerDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<LawyerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/lawyer`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setData(await response.json());
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

   const cards = [
    {
      label: 'Total Cases',
      value: data?.totalCases || 0,
      icon: Briefcase,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Active Cases',
      value: data?.activeCases || 0,
      icon: Clock,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Resolved Cases',
      value: data?.resolvedCases || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Case Resolution Rate',
      value: `${data?.winRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Lawyer Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-lg shadow p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-slate-600 text-sm font-medium">{card.label}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
            </div>
          );
        })}
      </div>

      {data?.casesByType && Object.keys(data.casesByType).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Cases by Practice Area</h3>
          <div className="space-y-3">
            {Object.entries(data.casesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-slate-700 capitalize">{type}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / (data?.totalCases || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-slate-900 font-semibold w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
