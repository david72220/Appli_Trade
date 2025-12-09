import React, { useState, useMemo } from 'react';
import { Trade } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from 'lucide-react';

interface CalendarViewProps {
  trades: Trade[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ trades }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helpers for date manipulation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

  // Aggregate data
  const calendarData = useMemo(() => {
    const dailyData: Record<string, { pnl: number; count: number }> = {};
    const monthTotal = { pnl: 0, count: 0, winners: 0, losers: 0 };

    trades.forEach(trade => {
      const tradeDate = new Date(trade.date);
      if (tradeDate.getMonth() === month && tradeDate.getFullYear() === year) {
        const dayKey = tradeDate.getDate();
        
        if (!dailyData[dayKey]) {
          dailyData[dayKey] = { pnl: 0, count: 0 };
        }
        
        dailyData[dayKey].pnl += trade.pnl;
        dailyData[dayKey].count += 1;
        
        // Month totals
        monthTotal.pnl += trade.pnl;
        monthTotal.count += 1;
        if (trade.pnl > 0) monthTotal.winners++;
        if (trade.pnl < 0) monthTotal.losers++;
      }
    });

    return { dailyData, monthTotal };
  }, [trades, month, year]);

  // Generate weeks grid
  const weeks = useMemo(() => {
    const weeksArray = [];
    let currentWeek = [];
    
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(null);
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining slots in last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeksArray.push(currentWeek);
    }

    return weeksArray;
  }, [daysInMonth, firstDayOfMonth]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <h2 className="text-xl font-bold text-white min-w-[150px] text-center">
            {currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-700/50">
           <div className="text-sm">
             <span className="text-slate-400">P&L Mensuel:</span>
             <span className={`ml-2 font-bold text-lg ${calendarData.monthTotal.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(calendarData.monthTotal.pnl)}
             </span>
           </div>
           <div className="w-px h-8 bg-slate-700"></div>
           <div className="text-xs text-slate-400 flex flex-col">
              <span>{calendarData.monthTotal.count} trades</span>
              <span>{calendarData.monthTotal.winners}W - {calendarData.monthTotal.losers}L</span>
           </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
        <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-sm">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-900/50">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-slate-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks Rows */}
          <div className="divide-y divide-slate-700">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="grid grid-cols-7 divide-x divide-slate-700">
                {week.map((day, dIndex) => {
                  const data = day ? calendarData.dailyData[day] : null;
                  const isPositive = data ? data.pnl > 0 : false;
                  const hasTrades = data && data.count > 0;

                  return (
                    <div key={`${wIndex}-${dIndex}`} className="min-h-[120px] p-2 relative group hover:bg-slate-800/50 transition-colors">
                      {day && (
                        <>
                          <span className="absolute top-2 right-3 text-sm text-slate-500 font-medium">
                            {day < 10 ? `0${day}` : day}
                          </span>
                          
                          {hasTrades ? (
                            <div className={`mt-6 p-2 rounded-lg border flex flex-col items-center justify-center h-[calc(100%-2rem)] transition-all ${
                                isPositive 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/20' 
                                    : 'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500/20'
                            }`}>
                               <span className={`text-lg font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                 {data.pnl >= 0 ? '+' : ''}{Math.round(data.pnl)}€
                               </span>
                               <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                  <FileText size={10} />
                                  <span>{data.count} trades</span>
                               </div>
                            </div>
                          ) : (
                             null
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Stats Column */}
        <div className="space-y-4">
           {weeks.map((week, index) => {
             // Calculate weekly stats
             let weeklyPnL = 0;
             let weeklyCount = 0;
             let activeDays = 0;

             week.forEach(day => {
               if(day && calendarData.dailyData[day]) {
                 weeklyPnL += calendarData.dailyData[day].pnl;
                 weeklyCount += calendarData.dailyData[day].count;
                 activeDays++;
               }
             });

             const isWeekPositive = weeklyPnL >= 0;

             return (
               <div key={index} className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col justify-center min-h-[120px] shadow-sm relative overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isWeekPositive && weeklyCount > 0 ? 'bg-emerald-500' : weeklyCount > 0 ? 'bg-rose-500' : 'bg-slate-700'}`}></div>
                  <h3 className="text-slate-400 text-xs uppercase font-bold mb-1 ml-2">Semaine {index + 1}</h3>
                  {weeklyCount > 0 ? (
                    <div className="ml-2">
                        <div className={`text-xl font-bold ${isWeekPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {weeklyPnL >= 0 ? '+' : ''}{formatCurrency(weeklyPnL)}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            {activeDays} jours traités • {weeklyCount} trades
                        </div>
                    </div>
                  ) : (
                      <div className="ml-2 text-slate-600 text-sm italic">Aucune activité</div>
                  )}
               </div>
             )
           })}
        </div>
      </div>
    </div>
  );
};