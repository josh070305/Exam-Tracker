import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  accent: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, hint, icon, accent }) => {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition duration-200 group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xl p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition duration-200">
          {icon}
        </span>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <div className="mt-1 text-xs text-slate-500 font-medium flex items-center gap-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${accent}`} />
          <span>{hint}</span>
        </div>
      </div>
    </div>
  );
};
