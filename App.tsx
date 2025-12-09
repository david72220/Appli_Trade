import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Plus, BrainCircuit, Settings, RotateCw, AlertCircle, Database, CheckCircle, Wifi, ShieldCheck, LogIn, Globe } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TradeList } from './components/TradeList';
import { TradeForm } from './components/TradeForm';
import { SettingsModal } from './components/SettingsModal';
import { Trade, NotionConfig } from './types';
import { analyzeTradeJournal } from './services/geminiService';
import { fetchNotionTrades, addNotionTrade, deleteNotionTrade, testNotionConnection } from './services/notionService';

const LOCAL_STORAGE_KEY = 'tradejournal_data_v1';
const NOTION_CONFIG_KEY = 'tradejournal_notion_config';
// Default to user's Cloudflare worker
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

function App() {
  // 1. Initialize Config from LocalStorage ONLY (No hardcoded secrets)
  const [notionConfig, setNotionConfig] = useState<NotionConfig | null>(() => {
    const saved = localStorage.getItem(NOTION_CONFIG_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [trades, setTrades] = useState<Trade[]>([]);
  const [view, setView] = useState<'dashboard' | 'journal'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding State
  const [onboardingData, setOnboardingData] = useState<NotionConfig>({
    apiKey: '',
    databaseId: '',
    useProxy: true,
    proxyUrl: DEFAULT_PROXY_URL
  });
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [showAdvancedOnboarding, setShowAdvancedOnboarding] = useState(false);

  // Initial Load
  useEffect(() => {
    const savedTrades = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTrades) {
      try {
        setTrades(JSON.parse(savedTrades));
      } catch (e) {
        console.error("Failed to parse trades from local storage");
      }
    }

    // Try to load from Notion immediately if config exists
    if (notionConfig) {
      loadTradesFromNotion(notionConfig);
    }
  }, [notionConfig]);

  // Save to LocalStorage as cache
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const loadTradesFromNotion = async (config: NotionConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      const notionTrades = await fetchNotionTrades(config);
      setTrades(notionTrades);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notionTrades));
    } catch (err: any) {
      console.error("Notion Sync Error:", err);
      setError("Erreur de synchro Notion: " + (err.message || "Erreur inconnue"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = (config: NotionConfig) => {
    setNotionConfig(config);
    localStorage.setItem(NOTION_CONFIG_KEY, JSON.stringify(config));
    setShowSettings(false);
    // Trigger reload is handled by useEffect on notionConfig change
  };

  const handleAddTrade = async (newTrade: Trade) => {
    // Optimistic Update
    const tempTrade = { ...newTrade, id: 'temp-' + Date.now() };
    setTrades(prev => [tempTrade, ...prev]);

    if (notionConfig && notionConfig.apiKey !== 'local') {
      try {
        const notionId = await addNotionTrade(notionConfig, newTrade);
        // Update the temp ID with real Notion ID
        setTrades(prev => prev.map(t => t.id === tempTrade.id ? { ...t, id: notionId } : t));
      } catch (err: any) {
        setError("Erreur lors de l'ajout sur Notion. Données locales seulement. " + err.message);
        console.error(err);
      }
    } else {
        // Pure local mode
        setTrades(prev => prev.map(t => t.id === tempTrade.id ? newTrade : t)); 
    }
  };

  const handleDeleteTrade = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce trade ?')) return;

    // Optimistic Delete
    const originalTrades = [...trades];
    setTrades(prev => prev.filter(t => t.id !== id));

    if (notionConfig && notionConfig.apiKey !== 'local') {
      try {
        await deleteNotionTrade(notionConfig, id);
      } catch (err: any) {
        setError("Impossible de supprimer sur Notion: " + err.message);
        setTrades(originalTrades); // Revert
      }
    }
  };

  const handleRunAnalysis = async () => {
    setShowAiModal(true);
    if (!aiAnalysis) {
        setIsAnalyzing(true);
        const result = await analyzeTradeJournal(trades);
        setAiAnalysis(result);
        setIsAnalyzing(false);
    }
  };

  const handleOnboardingTest = async () => {
    setTestStatus('loading');
    setTestMessage('Connexion...');
    
    const cleanData = {
        ...onboardingData,
        apiKey: cleanApiKey(onboardingData.apiKey),
        databaseId: cleanNotionId(onboardingData.databaseId)
    };

    try {
        await testNotionConnection(cleanData);
        setTestStatus('success');
        setTestMessage('Succès ! Base de données connectée.');
        // Update state with cleaned data
        setOnboardingData(cleanData);
    } catch (err: any) {
        setTestStatus('error');
        setTestMessage(err.message);
    }
  };

  const handleOnboardingSave = () => {
      // Ensure we use clean data
      const finalData = {
          ...onboardingData,
          apiKey: cleanApiKey(onboardingData.apiKey),
          databaseId: cleanNotionId(onboardingData.databaseId)
      };
      setNotionConfig(finalData);
      localStorage.setItem(NOTION_CONFIG_KEY, JSON.stringify(finalData));
  };

  // --- WELCOME SCREEN (If no config) ---
  if (!notionConfig) {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-slate-100">
              <div className="max-w-md w-full bg-surface border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
                  <div className="p-8 text-center border-b border-slate-700 bg-slate-900/50">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-blue-500/20">TJ</div>
                      <h1 className="text-2xl font-bold text-white mb-2">Bienvenue sur TradePro</h1>
                      <p className="text-slate-400 text-sm">Votre journal de trading connecté à Notion et propulsé par l'IA.</p>
                  </div>

                  <div className="p-8 space-y-6">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                          <ShieldCheck className="text-blue-400 shrink-0" size={24} />
                          <div className="text-xs text-blue-200">
                              <p className="font-bold mb-1">Sécurité & Confidentialité</p>
                              <p>Vos clés API sont stockées uniquement dans votre navigateur (LocalStorage). Aucune donnée ne transite par nos serveurs.</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Notion Internal Token</label>
                              <input 
                                  type="password" 
                                  placeholder="secret_..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                  value={onboardingData.apiKey}
                                  onChange={e => setOnboardingData(prev => ({...prev, apiKey: e.target.value}))}
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Database ID</label>
                              <input 
                                  type="text" 
                                  placeholder="Ex: 2c496280... ou URL complète"
                                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                                  value={onboardingData.databaseId}
                                  onChange={e => setOnboardingData(prev => ({...prev, databaseId: e.target.value}))}
                              />
                          </div>

                          <div className="pt-2">
                            <button 
                                onClick={() => setShowAdvancedOnboarding(!showAdvancedOnboarding)}
                                className="text-xs text-slate-500 hover:text-white flex items-center gap-1 mb-2"
                            >
                                {showAdvancedOnboarding ? 'Masquer' : 'Afficher'} options avancées (Proxy)
                            </button>
                            
                            {showAdvancedOnboarding && (
                                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4 animate-fade-in">
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Proxy URL (Cloudflare Worker)</label>
                                    <input 
                                        type="text" 
                                        placeholder={DEFAULT_PROXY_URL}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-xs text-white mb-1"
                                        value={onboardingData.proxyUrl}
                                        onChange={e => setOnboardingData(prev => ({...prev, proxyUrl: e.target.value}))}
                                    />
                                    <p className="text-[10px] text-slate-500">Par défaut: Votre worker Cloudflare.</p>
                                </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between pt-2">
                             <button 
                                onClick={handleOnboardingTest}
                                disabled={!onboardingData.apiKey || !onboardingData.databaseId || testStatus === 'loading'}
                                className="text-sm text-slate-400 hover:text-white flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                             >
                                {testStatus === 'loading' ? <RotateCw size={16} className="animate-spin"/> : <Wifi size={16} />}
                                Tester la connexion
                             </button>
                             
                             {testStatus === 'success' && <span className="text-emerald-400 flex items-center gap-1 text-sm"><CheckCircle size={14}/> Connecté</span>}
                             {testStatus === 'error' && <span className="text-rose-400 flex items-center gap-1 text-sm"><AlertCircle size={14}/> Erreur</span>}
                          </div>
                          
                          {testStatus === 'error' && <p className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">{testMessage}</p>}
                      </div>

                      <button 
                          onClick={handleOnboardingSave}
                          disabled={testStatus !== 'success'}
                          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                              testStatus === 'success' 
                                ? 'bg-primary hover:bg-blue-600 text-white shadow-blue-500/20 cursor-pointer' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                      >
                          <LogIn size={20} />
                          Accéder au Dashboard
                      </button>

                      <div className="text-center pt-2">
                          <button 
                            onClick={() => {
                                // Dummy local config
                                const localConfig = { apiKey: 'local', databaseId: 'local', useProxy: false };
                                handleSaveSettings(localConfig);
                                setError("Mode local activé. La synchronisation Notion est désactivée.");
                            }}
                            className="text-xs text-slate-500 hover:text-slate-300 underline"
                          >
                              Ou continuer en mode local (Hors ligne)
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-background text-slate-100 font-sans selection:bg-primary/30">
      {/* Sidebar / Navigation */}
      <nav className="fixed top-0 left-0 h-full w-20 md:w-64 bg-surface border-r border-slate-700 z-30 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">TJ</div>
            <span className="text-xl font-bold tracking-tight hidden md:block">TradePro</span>
        </div>

        <div className="flex-1 py-6 space-y-2 px-3">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === 'dashboard' ? 'bg-primary text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium hidden md:block">Tableau de Bord</span>
          </button>
          
          <button 
             onClick={() => setView('journal')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              view === 'journal' ? 'bg-primary text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <List size={20} />
            <span className="font-medium hidden md:block">Journal</span>
          </button>
        </div>

        <div className="p-4 border-t border-slate-700 space-y-4">
           {notionConfig.apiKey !== 'local' ? (
               <div className="flex items-center gap-2 px-4 text-xs text-emerald-400 bg-emerald-500/10 py-2 rounded-lg border border-emerald-500/20">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                   Notion Connecté
               </div>
           ) : (
               <div className="flex items-center gap-2 px-4 text-xs text-slate-400 bg-slate-800 py-2 rounded-lg border border-slate-700">
                   <div className="w-2 h-2 rounded-full bg-slate-500"></div>
                   Mode Local
               </div>
           )}

           <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors"
           >
                <Settings size={20} />
                <span className="font-medium hidden md:block">Paramètres</span>
           </button>

           <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-4 text-center">
              <BrainCircuit className="mx-auto mb-2 text-purple-300" size={24} />
              <p className="text-xs text-purple-200 mb-3 hidden md:block">Besoin d'un avis objectif ?</p>
              <button 
                onClick={handleRunAnalysis}
                className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-white/10"
              >
                Analyse IA
              </button>
           </div>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-slate-700 z-40 flex justify-around p-3">
          <button onClick={() => setView('dashboard')} className={`p-2 rounded-lg ${view === 'dashboard' ? 'text-primary' : 'text-slate-400'}`}>
            <LayoutDashboard size={24} />
          </button>
          <button onClick={() => setShowForm(true)} className="bg-primary text-white p-3 rounded-full -mt-8 shadow-lg shadow-blue-600/30 border-4 border-background">
            <Plus size={24} />
          </button>
          <button onClick={() => setView('journal')} className={`p-2 rounded-lg ${view === 'journal' ? 'text-primary' : 'text-slate-400'}`}>
            <List size={24} />
          </button>
           <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400">
            <Settings size={24} />
          </button>
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
              {view === 'dashboard' ? 'Performance Globale' : 'Historique des Trades'}
              {isLoading && <RotateCw className="animate-spin text-primary" size={20} />}
            </h1>
            <p className="text-slate-400 text-sm">
               {notionConfig.apiKey !== 'local' ? 'Synchronisation Notion Active' : 'Mode Local (Données navigateur uniquement)'}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <button 
                onClick={() => notionConfig && loadTradesFromNotion(notionConfig)}
                className="md:hidden bg-slate-800 text-white p-2 rounded-lg"
                title="Refresh"
             >
                <RotateCw size={20} className={isLoading ? "animate-spin" : ""} />
             </button>
             <button 
                onClick={handleRunAnalysis}
                className="md:hidden bg-indigo-600 text-white p-2 rounded-lg"
             >
                <BrainCircuit size={20} />
             </button>
             <button 
              onClick={() => setShowForm(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white font-bold py-2.5 px-5 rounded-lg transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Ajouter un Trade</span>
              <span className="md:hidden">Nouveau</span>
            </button>
          </div>
        </header>

        {error && (
            <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-sm">{error}</p>
                <button onClick={() => setError(null)} className="ml-auto hover:text-white"><Settings size={16} onClick={() => setShowSettings(true)}/></button>
            </div>
        )}

        {view === 'dashboard' ? (
          <Dashboard trades={trades} />
        ) : (
          <TradeList trades={trades} onDeleteTrade={handleDeleteTrade} />
        )}
      </main>

      {/* Modals */}
      {showForm && (
        <TradeForm 
          onAddTrade={handleAddTrade} 
          onClose={() => setShowForm(false)} 
        />
      )}

      {showSettings && (
        <SettingsModal
          config={notionConfig}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-surface border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-900/50">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <BrainCircuit className="text-purple-400" size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white">Analyse Coach IA</h2>
                 </div>
                 <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white">Close</button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                 {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p>Analyse de vos performances en cours...</p>
                    </div>
                 ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                       {aiAnalysis ? (
                           <div dangerouslySetInnerHTML={{ 
                               __html: aiAnalysis
                               .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                               .replace(/### (.*?)\n/g, '<h3 class="text-lg font-bold text-purple-300 mt-4 mb-2">$1</h3>')
                               .replace(/- (.*?)\n/g, '<li class="text-slate-300">$1</li>')
                               .replace(/\n/g, '<br />')
                           }} />
                       ) : (
                           <p className="text-center text-slate-500">Aucune analyse disponible.</p>
                       )}
                    </div>
                 )}
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex justify-end">
                  <button 
                    onClick={() => {
                        setAiAnalysis(null);
                        handleRunAnalysis();
                    }}
                    disabled={isAnalyzing}
                    className="text-sm text-primary hover:text-blue-400 font-medium disabled:opacity-50"
                  >
                    Régénérer l'analyse
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;