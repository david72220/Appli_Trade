import React, { useMemo } from 'react';
import { Trade } from '../types';
import { CalendarRange, TrendingUp, TrendingDown } from 'lucide-react';

interface YearlyViewProps {
  trades: Trade[];
}

export const YearlyView: React.FC<YearlyViewProps> = ({ trades }) => {
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

  const data = useMemo(() => {
    // Structure: { 2024: { 0: { pnl: 100, count: 2 }, 1: ... , total: { pnl: 500, count: 10 } } }
    const yearsData: Record<number, { 
      months: Record<number, { pnl: number; count: number }>; 
      total: { pnl: number; count: number; winners: number; losers: number } 
    }> = {};

    trades.forEach(trade => {
      const date = new Date(trade.date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11

      if (!yearsData[year]) {
        yearsData[year] = { 
          months: {}, 
          total: { pnl: 0, count: 0, winners: 0, losers: 0 } 
        };
      }

      // Initialize month if needed
      if (!yearsData[year].months[month]) {
        yearsData[year].months[month] = { pnl: 0, count: 0 };
      }

      // Add data to month
      yearsData[year].months[month].pnl += trade.pnl;
      yearsData[year].months[month].count += 1;

      // Add data to year total
      yearsData[year].total.pnl += trade.pnl;
      yearsData[year].total.count += 1;
      if (trade.pnl > 0) yearsData[year].total.winners++;
      if (trade.pnl < 0) yearsData[year].total.losers++;
    });

    // Get sorted years (descending)
    const sortedYears = Object.keys(yearsData).map(Number).sort((a, b) => b - a);

    return { yearsData, sortedYears };
  }, [trades]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  if (trades.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-700 border-dashed rounded-xl">
            <CalendarRange size={48} className="mb-4 opacity-50"/>
            <p>Aucune donnée à afficher pour le moment.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Global Stats Summary (All Time) */}
      {/* Could be added here if needed, but Dashboard already has it */}

      <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700">
                    <th className="p-4 font-bold text-white sticky left-0 bg-slate-900 z-10 border-r border-slate-700">Année</th>
                    {MONTHS.map(m => (
                        <th key={m} className="p-4 font-medium text-slate-400 text-center min-w-[80px]">{m}</th>
                    ))}
                    <th className="p-4 font-bold text-slate-200 text-center bg-slate-800/30 border-l border-slate-700">TOTAL</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
                {data.sortedYears.map(year => {
                    const yearData = data.yearsData[year];
                    const isYearPositive = yearData.total.pnl >= 0;

                    return (
                        <tr key={year} className="hover:bg-slate-800/30 transition-colors group">
                            {/* Year Column */}
                            <td className="p-4 font-bold text-white sticky left-0 bg-surface group-hover:bg-slate-800 border-r border-slate-700 z-10">
                                <div className="flex flex-col">
                                    <span className="text-lg">{year}</span>
                                    <span className="text-xs text-slate-500 font-normal">{yearData.total.count} trades</span>
                                </div>
                            </td>

                            {/* Month Columns */}
                            {MONTHS.map((_, index) => {
                                const monthData = yearData.months[index];
                                if (!monthData) {
                                    return <td key={index} className="p-4 text-center text-slate-700">-</td>;
                                }

                                const isPos = monthData.pnl >= 0;
                                return (
                                    <td key={index} className="p-2 text-center">
                                        <div className={`flex flex-col items-center justify-center py-1 rounded ${
                                            isPos ? 'bg-emerald-500/5' : 'bg-rose-500/5'
                                        }`}>
                                            <span className={`font-bold text-sm ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {Math.round(monthData.pnl)}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {monthData.count}t
                                            </span>
                                        </div>
                                    </td>
                                );
                            })}

                            {/* Year Total Column */}
                            <td className="p-4 text-center bg-slate-800/30 border-l border-slate-700">
                                <div className="flex flex-col items-center">
                                    <span className={`text-base font-bold ${isYearPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {formatCurrency(yearData.total.pnl)}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                        {isYearPositive ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                                        <span>{(yearData.total.winners / yearData.total.count * 100).toFixed(0)}% WR</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
    </div>
  );
};