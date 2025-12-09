import React, { useState, useEffect } from 'react';
import { NotionConfig } from '../types';
import { Settings, Save, X, AlertTriangle, Database, CheckCircle, Wifi, Globe, RotateCw } from 'lucide-react';
import { testNotionConnection } from '../services/notionService';

interface SettingsModalProps {
  config: NotionConfig | null;
  onSave: (config: NotionConfig) => void;
  onClose: () => void;
}

const DEFAULT_PROXY_URL = 'https://appli-trade.david-ollivier-fr.workers.dev/';

const cleanApiKey = (key: string) => key.trim();
const cleanNotionId = (input: string) => {
    const trimmed = input.trim();
    // Check if it's a full URL
    if (trimmed.includes('notion.so')) {
        // Extract ID from URL: https://www.notion.so/My-Db-Name-32chrID?v=...
        const matches = trimmed.match(/([a-f0-9]{32})/);
        if (matches && matches[1]) return matches[1];
    }
    return trimmed;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onClose }) => {
  const [formData, setFormData] = useState<NotionConfig>({
    apiKey: '',
    databaseId: '',
    useProxy: true,
    proxyUrl: DEFAULT_PROXY_URL
  });
  
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (config) {
      setFormData(prev => ({
          ...prev, 
          ...config, 
          proxyUrl: config.proxyUrl || DEFAULT_PROXY_URL
      }));
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
        ...formData,
        apiKey: cleanApiKey(formData.apiKey),
        databaseId: cleanNotionId(formData.databaseId)
    });
  };

  const handleTestConnection = async () => {
      setTestStatus('loading');
      setTestMessage('Test de connexion...');
      const cleanData = {
          ...formData,
          apiKey: cleanApiKey(formData.apiKey),
          databaseId: cleanNotionId(formData.databaseId)
      };
      
      try {
          await testNotionConnection(cleanData);
          setTestStatus('success');
          setTestMessage('Connexion réussie ! Base de données trouvée.');
      } catch (err: any) {
          setTestStatus('error');
          setTestMessage("Erreur: " + err.message);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
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
            <p className="text-xs text-slate-500 mt-1">Collez l'ID ou l'URL complète de la base de données.</p>
          </div>

          <div className="border-t border-slate-700 pt-4">
             <div className="flex items-center justify-between mb-2">
                 <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                    <Globe size={16} /> Proxy CORS
                 </h3>
                 <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="proxy"
                        checked={formData.useProxy}
                        onChange={(e) => setFormData(prev => ({ ...prev, useProxy: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-primary focus:ring-primary"
                    />
                    <label htmlFor="proxy" className="text-sm text-slate-400">Activer</label>
                 </div>
             </div>
             
             {formData.useProxy && (
                 <div>
                    <input
                        type="text"
                        placeholder={DEFAULT_PROXY_URL}
                        value={formData.proxyUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, proxyUrl: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Défaut: <code>{DEFAULT_PROXY_URL}</code>
                    </p>
                 </div>
             )}
          </div>

          {/* Schema Helper Panel */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-xs text-slate-400">
             <p className="font-bold text-slate-300 mb-2">Colonnes requises dans Notion :</p>
             <ul className="grid grid-cols-2 gap-2">
                 <li><code className="bg-slate-800 px-1 rounded">Jour</code> (Titre)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Pair</code> (Select)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Date</code> (Date)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Type</code> (Select)</li>
                 <li><code className="bg-slate-800 px-1 rounded">PnL</code> (Nombre)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Entry</code> (Nombre)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Exit</code> (Nombre)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Setup</code> (Texte)</li>
                 <li><code className="bg-slate-800 px-1 rounded">Notes</code> (Texte)</li>
             </ul>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <button 
                type="button" 
                onClick={handleTestConnection}
                disabled={!formData.apiKey || !formData.databaseId || testStatus === 'loading'}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
             >
                {testStatus === 'loading' ? <RotateCw size={16} className="animate-spin"/> : <Wifi size={16} />}
                Tester
             </button>

             <button
                type="submit"
                className="flex-[2] bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                <Save size={20} />
                Sauvegarder
            </button>
          </div>

          {testMessage && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${testStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {testStatus === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0"/> : <AlertTriangle size={16} className="mt-0.5 shrink-0"/>}
                  <span>{testMessage}</span>
              </div>
          )}

        </form>
      </div>
    </div>
  );
};