import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  isCurrency?: boolean;
  subValue?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, isCurrency, subValue }) => {
  const isPositive = typeof value === 'number' ? value >= 0 : true;
  const displayValue = isCurrency 
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value))
    : value;

  // Determine color for P&L styling
  let valueColorClass = "text-slate-100";
  if (isCurrency && typeof value === 'number') {
    valueColorClass = value > 0 ? "text-emerald-400" : value < 0 ? "text-rose-400" : "text-slate-100";
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-slate-700/50 rounded-lg">
          <Icon size={20} className="text-slate-300" />
        </div>
      </div>
      <div className={`text-2xl font-bold ${valueColorClass}`}>
        {displayValue}
      </div>
      {subValue && (
        <p className="text-xs text-slate-500 mt-2">{subValue}</p>
      )}
    </div>
  );
};