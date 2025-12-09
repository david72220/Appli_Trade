export enum TradeType {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum TradeStatus {
  WIN = 'WIN',
  LOSS = 'LOSS',
  BE = 'BE' // Break Even
}

export interface Trade {
  id: string; // Will match Notion Page ID
  date: string; // ISO string
  pair: string;
  type: TradeType;
  entryPrice: number;
  exitPrice: number;
  pnl: number; // Profit and Loss amount
  setup: string;
  notes: string;
  tags: string[];
}

export interface TradeStats {
  totalTrades: number;
  totalPnL: number;
  winRate: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  bestDay: number;
  worstDay: number;
  currentStreak: number;
}

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
  useProxy: boolean;
  proxyUrl?: string; // Optional custom proxy URL
}