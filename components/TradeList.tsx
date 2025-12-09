import React from 'react';
import { Trade, TradeType } from '../types';
import { Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TradeListProps {
  trades: Trade[];
  onDeleteTrade: (id: string) => void;
}

export const TradeList: React.FC<TradeListProps> = ({ trades, onDeleteTrade }) => {
  // Sort trades descending by date
  const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-surface border border-slate-700 rounded-xl overflow-hidden shadow-sm animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 uppercase font-medium border-b border-slate-700">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Paire</th>
              <th className="px-6 py-4">Direction</th>
              <th className="px-6 py-4">Setup</th>
              <th className="px-6 py-4 text-right">Entrée</th>
              <th className="px-6 py-4 text-right">Sortie</th>
              <th className="px-6 py-4 text-right">P&L</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {sortedTrades.length === 0 ? (
                <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        Aucun trade enregistré. Commencez par en ajouter un.
                    </td>
                </tr>
            ) : (
                sortedTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{trade.date}</td>
                    <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-700/50 text-slate-200 border border-slate-600/50 font-bold text-xs">
                            {trade.pair}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        trade.type === TradeType.LONG 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-orange-500/10 text-orange-400'
                    }`}>
                        {trade.type === TradeType.LONG ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                        {trade.type}
                    </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{trade.setup}</td>
                    <td className="px-6 py-4 text-right">{trade.entryPrice}</td>
                    <td className="px-6 py-4 text-right">{trade.exitPrice}</td>
                    <td className={`px-6 py-4 text-right font-bold ${
                    trade.pnl > 0 ? 'text-emerald-400' : trade.pnl < 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                    {trade.pnl > 0 ? '+' : ''}{trade.pnl.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 text-center">
                    <button 
                        onClick={() => onDeleteTrade(trade.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-lg"
                        title="Supprimer"
                    >
                        <Trash2 size={16} />
                    </button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};