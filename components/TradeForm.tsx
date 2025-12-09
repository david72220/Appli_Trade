import React, { useState } from 'react';
import { Trade, TradeType } from '../types';
import { PlusCircle, X } from 'lucide-react';

interface TradeFormProps {
  onAddTrade: (trade: Trade) => void;
  onClose: () => void;
}

const COMMON_PAIRS = [
    // Forex Majors
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "USDCHF", "NZDUSD",
    // Forex Crosses
    "EURJPY", "GBPJPY", "AUDJPY", "EURGBP",
    // Indices
    "US30", "NAS100", "SPX500", "DAX40", "CAC40",
    // Commodities
    "XAUUSD", "XAGUSD", "OIL",
    // Crypto
    "BTCUSD", "ETHUSD", "SOLUSD"
];

export const TradeForm: React.FC<TradeFormProps> = ({ onAddTrade, onClose }) => {
  const [formData, setFormData] = useState<Partial<Trade>>({
    date: new Date().toISOString().split('T')[0],
    type: TradeType.LONG,
    pair: 'EURUSD', // Default
    entryPrice: 0,
    exitPrice: 0,
    pnl: 0,
    setup: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pair || !formData.date) return;

    const newTrade: Trade = {
      id: crypto.randomUUID(),
      date: formData.date!,
      pair: formData.pair!,
      type: formData.type as TradeType,
      entryPrice: Number(formData.entryPrice),
      exitPrice: Number(formData.exitPrice),
      pnl: Number(formData.pnl),
      setup: formData.setup || 'General',
      notes: formData.notes || '',
      tags: [],
    };

    onAddTrade(newTrade);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Nouveau Trade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Date</label>
              <input
                type="date"
                name="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Paire / Actif</label>
              <select
                name="pair"
                required
                value={formData.pair}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
              >
                {COMMON_PAIRS.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Direction</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={TradeType.LONG}>LONG</option>
                <option value={TradeType.SHORT}>SHORT</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Stratégie / Setup</label>
              <input
                type="text"
                name="setup"
                placeholder="Breakout..."
                value={formData.setup}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Entrée</label>
              <input
                type="number"
                step="any"
                name="entryPrice"
                value={formData.entryPrice}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Sortie</label>
              <input
                type="number"
                step="any"
                name="exitPrice"
                value={formData.exitPrice}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">P&L (€)</label>
              <input
                type="number"
                step="any"
                name="pnl"
                required
                placeholder="0.00"
                value={formData.pnl}
                onChange={handleChange}
                className={`w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-primary outline-none ${
                    Number(formData.pnl) > 0 ? 'text-emerald-400' : Number(formData.pnl) < 0 ? 'text-rose-400' : 'text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Notes / Psychologie</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Comment vous sentiez-vous ? Pourquoi avez-vous pris ce trade ?"
              value={formData.notes}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
          >
            <PlusCircle size={20} />
            Ajouter au Journal
          </button>
        </form>
      </div>
    </div>
  );
};