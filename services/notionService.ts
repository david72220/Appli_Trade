import { NotionConfig, Trade, TradeType } from '../types';

// Notion API requires a proxy when called from the browser due to CORS policies.
const CORS_PROXY = 'https://corsproxy.io/?'; 
const NOTION_API_BASE = 'https://api.notion.com/v1';

const getHeaders = (config: NotionConfig) => ({
  'Authorization': `Bearer ${config.apiKey}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
});

const getBaseUrl = (config: NotionConfig) => {
  return config.useProxy ? `${CORS_PROXY}${encodeURIComponent(NOTION_API_BASE)}` : NOTION_API_BASE;
};

export const fetchNotionTrades = async (config: NotionConfig): Promise<Trade[]> => {
  try {
    const response = await fetch(`${getBaseUrl(config)}/databases/${config.databaseId}/query`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
      }),
    });

    if (!response.ok) {
      let errText = await response.text();
      try {
          const jsonErr = JSON.parse(errText);
          errText = jsonErr.message || errText;
      } catch (e) {
          // not json
      }
      
      if (response.status === 404) {
          throw new Error("Base de données introuvable (404). Avez-vous connecté l'intégration à la page Notion ? (Menu '...' > Connections > Votre Intégration)");
      }
      if (response.status === 401) {
          throw new Error("Non autorisé (401). Vérifiez votre clé API.");
      }
      
      throw new Error(`Erreur Notion (${response.status}): ${errText}`);
    }

    const data = await response.json();

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
    const response = await fetch(`${getBaseUrl(config)}/pages`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify({
        parent: { database_id: config.databaseId },
        properties: {
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

    if (!response.ok) {
        let errText = await response.text();
        try {
            const jsonErr = JSON.parse(errText);
            errText = jsonErr.message || errText;
        } catch(e) {}
        throw new Error(`Notion Add Error (${response.status}): ${errText}`);
    }
    
    const data = await response.json();
    return data.id; // Return the new Notion Page ID
  } catch (error) {
    console.error('Error adding to Notion:', error);
    throw error;
  }
};

export const deleteNotionTrade = async (config: NotionConfig, pageId: string): Promise<void> => {
    try {
        const response = await fetch(`${getBaseUrl(config)}/pages/${pageId}`, {
            method: 'PATCH', // Update to archive
            headers: getHeaders(config),
            body: JSON.stringify({
                archived: true
            })
        });

        if (!response.ok) {
             let errText = await response.text();
            throw new Error(`Failed to delete: ${errText}`);
        }
    } catch (error) {
        console.error('Error deleting from Notion:', error);
        throw error;
    }
};

// New function to test connection
export const testNotionConnection = async (config: NotionConfig): Promise<boolean> => {
    try {
        // Just try to fetch the database info
        const response = await fetch(`${getBaseUrl(config)}/databases/${config.databaseId}`, {
            method: 'GET',
            headers: getHeaders(config),
        });

        if (response.status === 200) return true;
        
        let err = await response.text();
        try {
            const json = JSON.parse(err);
            err = json.message || err;
        } catch(e){}
        
        throw new Error(err);
    } catch (error) {
        throw error;
    }
};