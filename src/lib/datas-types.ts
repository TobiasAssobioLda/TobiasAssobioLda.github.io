export type DatasRow = {
  rank: number;
  event_date: string;
  date_label: string;
  title: string;
  horse: string;
  tickers: string;
  ticker_up: string;
  ticker_down: string;
  action: string;
  status: string;
  score: number;
  price?: number | null;
  sl?: number | null;
  tp1?: number | null;
  tp2?: number | null;
  url?: string;
  source?: string;
  note?: string;
};

export type DatasPayload = {
  updated_at: string;
  timezone: string;
  count: number;
  rows: DatasRow[];
};
