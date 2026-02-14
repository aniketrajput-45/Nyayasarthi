import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Dashboard } from './Dashboard';

export const Analytics: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Analytics & Reports</h2>
      <Dashboard />
    </div>
  );
};
