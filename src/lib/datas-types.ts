export type DatasRow = {
  rank: number;
  event_date: string;
  date_label: string;
  title: string;
  horse: string;
  tickers: string;
  ticker_up: string;
  ticker_down: string;
  ticker_open?: string;
  book?: string;
  action: string;
  status: string;
  score: number;
  range?: string;
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
  opens_count: number;
  calendar_count: number;
  opens_rows: DatasRow[];
  calendar_rows: DatasRow[];
  /** @deprecated use calendar_rows */
  count?: number;
  /** @deprecated use calendar_rows */
  rows?: DatasRow[];
};
