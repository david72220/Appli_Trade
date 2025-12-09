import React, { useMemo, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, ReferenceLine, Cell 
} from 'recharts';
import { Wallet, Target, TrendingUp, TrendingDown, Activity, Calendar as CalendarIcon, BarChart2, Table2 } from 'lucide-react';
import { Trade, TradeStats } from '../types';
import { StatsCard } from './StatsCard';
import { CalendarView } from './CalendarView';
import { YearlyView } from './YearlyView';

interface DashboardProps {
  trades: Trade[];
}

export const Dashboard: React.FC<DashboardProps> = ({ trades }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'yearly'>('calendar');

  const stats: TradeStats = useMemo(() => {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        totalPnL: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        bestDay: 0,
        worstDay: 0,
        currentStreak: 0
      };
    }

    const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl <= 0);
    const winRate = (wins.length / totalTrades) * 100;

    const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

    const avgWin = wins.length ? grossProfit / wins.length : 0;
    const avgLoss = losses.length ? -grossLoss / losses.length : 0;

    // Group by day for best/worst day
    const dailyPnL: Record<string, number> = {};
    trades.forEach(t => {
      dailyPnL[t.date] = (dailyPnL[t.date] || 0) + t.pnl;
    });
    const days = Object.values(dailyPnL);
    const bestDay = Math.max(...days, 0);
    const worstDay = Math.min(...days, 0);

    return {
      totalTrades,
      totalPnL,
      winRate,
      profitFactor,
      avgWin,
      avgLoss,
      bestDay,
      worstDay,
      currentStreak: 0 // Simplification
    };
  }, [trades]);

  // Chart Data Preparation
  const equityCurveData = useMemo(() => {
    let cumulative = 0;
    // Sort trades by date ascending
    const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedTrades.map((t, index) => {
      cumulative += t.pnl;
      return {
        trade: index + 1,
        date: t.date,
        equity: cumulative
      };
    });
  }, [trades]);

  const dailyBarData = useMemo(() => {
    const daily: Record<string, number> = {};
    trades.forEach(t => {
      daily[t.date] = (daily[t.date] || 0) + t.pnl;
    });
    return Object.entries(daily)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([date, pnl]) => ({ date, pnl }));
  }, [trades]);


  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Net P&L" 
          value={stats.totalPnL} 
          icon={Wallet} 
          isCurrency 
        />
        <StatsCard 
          title="Win Rate" 
          value={stats.winRate.toFixed(1) + '%'} 
          icon={Target}
          subValue={`${trades.filter(t => t.pnl > 0).length}W - ${trades.filter(t => t.pnl <= 0).length}L`}
        />
        <StatsCard 
          title="Profit Factor" 
          value={stats.profitFactor.toFixed(2)} 
          icon={Activity}
          subValue={stats.profitFactor > 1.5 ? "Excellent" : stats.profitFactor > 1 ? "Bon" : "À améliorer"}
        />
         <StatsCard 
          title="Moy. Gagnant" 
          value={stats.avgWin} 
          icon={TrendingUp} 
          isCurrency
        />
      </div>

      {/* View Toggle */}
      <div className="flex justify-center md:justify-start overflow-x-auto pb-2">
        <div className="bg-surface p-1 rounded-lg border border-slate-700 inline-flex whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'overview' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 size={16} />
            Graphiques
          </button>
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'calendar' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon size={16} />
            Calendrier
          </button>
           <button 
            onClick={() => setActiveTab('yearly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'yearly' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table2 size={16} />
            Récap. Annuel
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Equity Curve */}
          <div className="lg:col-span-2 bg-surface border border-slate-700 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <TrendingUp className="text-primary" size={20} />
              Courbe de Capital (Equity Curve)
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                      dataKey="date" 
                      stroke="#94a3b8" 
                      fontSize={12} 
                      tickFormatter={(val) => val.substring(5)} // Show MM-DD
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                      formatter={(value: number) => [`${value.toFixed(2)} €`, 'Capital Cumulé']}
                      labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#60a5fa' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Performance */}
          <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <CalendarIcon className="text-primary" size={20} />
              P&L Journalier
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis hide dataKey="date" />
                  <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                      formatter={(value: number) => [`${value.toFixed(2)} €`, 'P&L']}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {dailyBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="animate-fade-in">
          <CalendarView trades={trades} />
        </div>
      )}

      {activeTab === 'yearly' && (
        <div className="animate-fade-in">
          <YearlyView trades={trades} />
        </div>
      )}
    </div>
  );
};