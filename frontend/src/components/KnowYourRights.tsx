import React from 'react';
import { BookOpen, ShieldCheck, Scale, Info, AlertTriangle } from 'lucide-react';

interface RightsProps {
  context?: string;
  className?: string;
}

const rightsData: Record<string, { title: string; rights: string[]; icon: any; color: string }> = {
  general: {
    title: "Basic Legal Rights",
    icon: BookOpen,
    color: "blue",
    rights: [
      "Right to legal representation",
      "Right to be informed of charges",
      "Right to a fair and speedy trial",
      "Right to remain silent"
    ]
  },
  arrest: {
    title: "Rights During Arrest",
    icon: ShieldCheck,
    color: "red",
    rights: [
      "Right to know the grounds of arrest",
      "Right to consult a lawyer of choice",
      "Must be produced before a Magistrate within 24 hours",
      "Right to inform a relative or friend"
    ]
  },
  cyber: {
    title: "Cybercrime Protections",
    icon: AlertTriangle,
    color: "orange",
    rights: [
      "Right to report anonymously in sensitive cases",
      "Right to have explicit content removed within 24-36 hours",
      "Data privacy protections under Information Technology Act",
      "Right to compensation for financial fraud"
    ]
  },
  civil: {
    title: "Civil Litigation Rights",
    icon: Scale,
    color: "purple",
    rights: [
      "Right to mediation before trial",
      "Right to appeal lower court decisions",
      "Equal protection under the law",
      "Right to access court records"
    ]
  }
};

export const KnowYourRights: React.FC<RightsProps> = ({ context = 'general', className = '' }) => {
  const data = rightsData[context] || rightsData.general;
  const Icon = data.icon;
  
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-900 icon-blue-600",
    red: "bg-red-50 border-red-200 text-red-900 icon-red-600",
    orange: "bg-orange-50 border-orange-200 text-orange-900 icon-orange-600",
    purple: "bg-purple-50 border-purple-200 text-purple-900 icon-purple-600"
  };

  const currentTheme = colorClasses[data.color];

  return (
    <div className={`p-4 rounded-xl border shadow-sm ${currentTheme} ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={20} className="opacity-80" />
        <h3 className="font-bold text-sm uppercase tracking-tight">{data.title}</h3>
      </div>
      <ul className="space-y-2">
        {data.rights.map((right, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
            <Info size={14} className="mt-0.5 shrink-0 opacity-60" />
            <span>{right}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-3 border-t border-current border-opacity-10 text-[10px] italic opacity-70">
        * Based on current BNSS & BNS guidelines.
      </div>
    </div>
  );
};