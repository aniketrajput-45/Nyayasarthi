import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { CitizenDashboard } from '../components/dashboards/CitizenDashboard';
import { PoliceDashboard } from '../components/dashboards/PoliceDashboard';
import { LawyerDashboard } from '../components/dashboards/LawyerDashboard';
import { JudgeDashboard } from '../components/dashboards/JudgeDashboard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      {user.role === 'citizen' && <CitizenDashboard />}
      {user.role === 'police' && <PoliceDashboard />}
      {user.role === 'lawyer' && <LawyerDashboard />}
      {user.role === 'judge' && <JudgeDashboard />}
    </div>
  );
};
