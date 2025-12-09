import React, { useState, useEffect } from 'react';
import { NotionConfig } from '../types';
import { Settings, Save, X, AlertTriangle, Database, CheckCircle, Wifi } from 'lucide-react';
import { testNotionConnection } from '../services/notionService';

interface SettingsModalProps {
  config: NotionConfig | null;
  onSave: (config: NotionConfig) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState<NotionConfig>({
    apiKey: '',
    databaseId: '',
    useProxy: true
  });
  
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTestConnection = async () => {
      setTestStatus('loading');
      setTestMessage('Test de connexion...');
      try {
          await testNotionConnection(formData);
          setTestStatus('success');
          setTestMessage('Connexion réussie ! Base de données trouvée.');
      } catch (err: any) {
          setTestStatus('error');
          setTestMessage("Erreur: " + err.message);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Settings className="text-primary" size={24} />
            <h2 className="text-xl font-bold text-white">Configuration Notion</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3">
             <AlertTriangle className="text-amber-400 shrink-0" size={20} />
             <div className="text-sm text-amber-200">
                <p className="font-bold mb-1">Important : Connecter l'intégration</p>
                <p>Dans Notion, allez sur votre base de données, cliquez sur les 3 points (...) en haut à droite {'>'} Connections {'>'} Connect to {'>'} Votre Intégration.</p>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Notion Internal Integration Token</label>
            <input
              type="password"
              placeholder="secret_..."
              required
              value={formData.apiKey}
              onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">Commence généralement par "secret_" ou "ntn_".</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Database ID</label>
            <div className="flex gap-2">
                <input
                type="text"
                placeholder="Ex: 8a2f5..."
                required
                value={formData.databaseId}
                onChange={(e) => setFormData(prev => ({ ...prev, databaseId: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
             <div className="flex items-center gap-3">
                <input
                type="checkbox"
                id="proxy"
                checked={formData.useProxy}
                onChange={(e) => setFormData(prev => ({ ...prev, useProxy: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary"
                />
                <label htmlFor="proxy" className="text-sm text-slate-400">
                    Utiliser Proxy CORS (Requis)
                </label>
             </div>
             
             <button 
                type="button" 
                onClick={handleTestConnection}
                disabled={!formData.apiKey || !formData.databaseId || testStatus === 'loading'}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-2"
             >
                {testStatus === 'loading' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Wifi size={14} />}
                Tester
             </button>
          </div>

          {testMessage && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${testStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {testStatus === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0"/> : <AlertTriangle size={16} className="mt-0.5 shrink-0"/>}
                  <span>{testMessage}</span>
              </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Sauvegarder & Synchroniser
          </button>
        </form>
      </div>
    </div>
  );
};