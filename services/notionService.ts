import { NotionConfig, Trade, TradeType } from '../types';

// Use the user's worker as default if not specified
const DEFAULT_PROXY = 'https://appli-trade.david-ollivier-fr.workers.dev/'; 
const NOTION_API_BASE = 'https://api.notion.com/v1';

const getHeaders = (config: NotionConfig) => ({
  'Authorization': `Bearer ${config.apiKey}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
});

// New Helper to perform proxied fetch correctly
// It constructs the full target URL, encodes it, and appends it to the proxy URL
const proxiedFetch = async (endpoint: string, config: NotionConfig, options: RequestInit = {}) => {
    // 1. Construct the Real Target URL
    const targetUrl = `${NOTION_API_BASE}${endpoint}`;
    
    let fetchUrl = targetUrl;
    
    if (config.useProxy) {
      let proxy = config.proxyUrl || DEFAULT_PROXY;
      
      // Ensure proxy ends with a slash if it doesn't have query params
      // This is important for path-based proxies like Cloudflare Workers
      if (!proxy.includes('?') && !proxy.endsWith('/')) {
          proxy += '/';
      }
      
      // 2. Encode the ENTIRE target URL
      // This is crucial. We don't want the proxy to interpret parts of the Notion path.
      // E.g. https://worker.dev/https%3A%2F%2Fapi.notion.com%2Fv1%2Fdatabases%2F...
      fetchUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
    }
  
    const res = await fetch(fetchUrl, {
       ...options,
       headers: {
           ...options.headers,
           ...getHeaders(config),
       },
       // Important: prevent browser caching of API responses
       cache: 'no-store'
    });

    if (!res.ok) {
        let errText = await res.text();
        try {
            const jsonErr = JSON.parse(errText);
            errText = jsonErr.message || errText;
        } catch (e) {
            // not json
        }
        
        if (res.status === 404) {
             // If proxy returns 404, it might be the proxy itself or Notion
             if (errText.includes('Notion')) {
                 throw new Error("Base de données introuvable (404). Vérifiez l'ID et la connexion de l'intégration.");
             }
             // Fallback
             throw new Error(`Erreur 404 (Not Found). Base de données introuvable ou URL incorrecte.`);
        }
        if (res.status === 401) {
            throw new Error("Non autorisé (401). Vérifiez votre clé API Notion.");
        }
        
        throw new Error(`Erreur API (${res.status}): ${errText}`);
    }
    
    return res;
};

export const fetchNotionTrades = async (config: NotionConfig): Promise<Trade[]> => {
  try {
    const response = await proxiedFetch(`/databases/${config.databaseId}/query`, config, {
      method: 'POST',
      body: JSON.stringify({
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("Notion Data Columns:", data.results.length > 0 ? Object.keys(data.results[0].properties) : "No data");

    // Map Notion properties to our Trade interface
    return data.results.map((page: any) => {
      const props = page.properties;
      
      // Helper to safely get values with fallbacks
      const getTitle = (p: any) => p?.title?.[0]?.plain_text || '';
      const getText = (p: any) => p?.rich_text?.[0]?.plain_text || '';
      const getNumber = (p: any) => p?.number || 0;
      const getSelect = (p: any) => p?.select?.name || '';
      const getDate = (p: any) => p?.date?.start || new Date().toISOString().split('T')[0];

      return {
        id: page.id,
        date: getDate(props.Date),
        // Try to get Pair from Select first (new schema), fallback to Title (old schema/safety)
        pair: getSelect(props.Pair) || getTitle(props.Pair) || 'UNKNOWN',
        type: (getSelect(props.Type) || 'LONG') as TradeType,
        entryPrice: getNumber(props.Entry),
        exitPrice: getNumber(props.Exit),
        pnl: getNumber(props.PnL),
        setup: getText(props.Setup),
        notes: getText(props.Notes),
        tags: [],
      };
    });
  } catch (error) {
    console.error('Error fetching from Notion:', error);
    throw error;
  }
};

export const addNotionTrade = async (config: NotionConfig, trade: Trade): Promise<string> => {
  try {
    const response = await proxiedFetch('/pages', config, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: config.databaseId },
        properties: {
          'Jour': {
            title: [{ text: { content: `@${trade.date}` } }] // Set title to date or ID
          },
          'Pair': {
            select: { name: trade.pair }
          },
          'Date': {
            date: { start: trade.date }
          },
          'Type': {
            select: { name: trade.type }
          },
          'Entry': {
            number: trade.entryPrice
          },
          'Exit': {
            number: trade.exitPrice
          },
          'PnL': {
            number: trade.pnl
          },
          'Setup': {
            rich_text: [{ text: { content: trade.setup } }]
          },
          'Notes': {
            rich_text: [{ text: { content: trade.notes } }]
          }
        }
      }),
    });
    
    const data = await response.json();
    return data.id; // Return the new Notion Page ID
  } catch (error: any) {
    console.error('Error adding to Notion:', error);
    // Helper to find missing columns in error message
    if(error.message && error.message.includes("property that exists")) {
        throw new Error(`Colonne manquante dans Notion: ${error.message}. Vérifiez que vous avez bien 'Notes', 'Entry', 'Exit', 'Setup' etc.`);
    }
    throw error;
  }
};

export const deleteNotionTrade = async (config: NotionConfig, pageId: string): Promise<void> => {
    try {
        await proxiedFetch(`/pages/${pageId}`, config, {
            method: 'PATCH', // Update to archive
            body: JSON.stringify({
                archived: true
            })
        });
    } catch (error) {
        console.error('Error deleting from Notion:', error);
        throw error;
    }
};

// New function to test connection
export const testNotionConnection = async (config: NotionConfig): Promise<boolean> => {
    try {
        // Just try to fetch the database info
        await proxiedFetch(`/databases/${config.databaseId}`, config, {
            method: 'GET'
        });
        return true;
    } catch (error) {
        throw error;
    }
};