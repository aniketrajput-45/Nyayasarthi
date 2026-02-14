import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Gavel, Clock, CheckCircle, Calendar } from 'lucide-react';

interface JudgeDashboardData {
  totalCases: number;
  pendingCases: number;
  completedCases: number;
  avgDuration: string;
}

export const JudgeDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<JudgeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/analytics/judge`, {
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
      icon: Gavel,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Pending Judgments',
      value: data?.pendingCases || 0,
      icon: Clock,
      color: 'bg-orange-100 text-orange-700',
    },
    {
      label: 'Completed Cases',
      value: data?.completedCases || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Avg Duration',
      value: `${data?.avgDuration || 0} days`,
      icon: Calendar,
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Judge Dashboard</h2>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pending Actions</h3>
          <p className="text-slate-600">
            You have <span className="font-bold text-orange-600">{data?.pendingCases}</span> pending judgments to review.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance</h3>
          <p className="text-slate-600">
            Average case duration: <span className="font-bold text-blue-600">{data?.avgDuration} days</span>
          </p>
        </div>
      </div>
    </div>
  );
};
