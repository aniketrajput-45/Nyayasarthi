import React from 'react';
import { 
  ShieldAlert, Landmark, Smartphone, Users, 
  Home, Briefcase, Zap, HeartHandshake, Scale
} from 'lucide-react';

interface TriageOption {
  id: string;
  label: string;
  icon: any;
  color: string;
  category: string;
}

const triageOptions: TriageOption[] = [
  { id: 'theft', label: 'Theft / Robbery', icon: ShieldAlert, color: 'text-red-600 bg-red-50', category: 'criminal' },
  { id: 'property', label: 'Property Dispute', icon: Landmark, color: 'text-amber-600 bg-amber-50', category: 'civil' },
  { id: 'cyber', label: 'Online Fraud / Hacking', icon: Smartphone, color: 'text-blue-600 bg-blue-50', category: 'cyber' },
  { id: 'assault', label: 'Physical Assault', icon: Users, color: 'text-orange-600 bg-orange-50', category: 'criminal' },
  { id: 'family', label: 'Family / Domestic', icon: HeartHandshake, color: 'text-pink-600 bg-pink-50', category: 'family' },
  { id: 'commercial', label: 'Business / Contract', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50', category: 'commercial' },
  { id: 'harassment', label: 'Harassment', icon: Zap, color: 'text-purple-600 bg-purple-50', category: 'criminal' },
  { id: 'other', label: 'Other Matters', icon: Scale, color: 'text-slate-600 bg-slate-50', category: 'other' },
];

interface VisualTriageProps {
  onSelect: (category: string, title: string) => void;
}

export const VisualTriage: React.FC<VisualTriageProps> = ({ onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {triageOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.category, option.label)}
            className={`
              flex flex-col items-center justify-center p-6 rounded-xl border-2 border-transparent 
              hover:border-blue-500 hover:shadow-md transition-all group
              ${option.color}
            `}
          >
            <option.icon size={32} className="mb-3 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold uppercase tracking-tight text-center">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};