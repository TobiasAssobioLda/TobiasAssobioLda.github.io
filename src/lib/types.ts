/** Tipos partilhados com data/web/opens.json (bot Trade1). */

export type OpenRow = {
  ticker: string;
  entry: number;
  price: number;
  qty: number;
  notional: number;
  pnl_pct: number;
  pnl_eur: number;
  pnl_r: number;
  sl?: number;
  tp1?: number;
  tp2?: number;
  horse?: string;
  news_hook?: string;
  news_what?: string;
  news_blurb?: string;
  news_impact?: number;
  opened_at?: string;
  /** Dias desde abertura (calendário). */
  open_days?: number;
  /** Time stop deste livro (dias). */
  time_stop_days?: number;
  /** Report / Nerd */
  diag?: string;
  corr_score?: number;
  sinal_score?: number;
  tp_tip?: string;
  tp_gap?: number | null;
  tp_sugerido_mid?: number | null;
  event_date?: string;
  horizon_days?: number | null;
};

export type BookSnapshot = {
  rows: OpenRow[];
  total_pnl_pct: number;
  total_pnl_eur: number;
  /** Banca interna no site (Pipoca). Chill não usa. */
  bank_eur?: number;
  equity_eur?: number;
};

export type OpensPayload = {
  updated_at: string;
  timezone: string;
  when_label: string;
  pipoca: BookSnapshot;
  chill: BookSnapshot;
  pipoca_all?: BookSnapshot;
  max?: BookSnapshot;
  rumors?: BookSnapshot;
  possible?: PossiblePayload;
};

export type PossibleRow = {
  ticker: string;
  book: string;
  horse?: string;
  impact: number;
  tries: number;
  max_tries?: number;
  reason?: string;
  next_check?: string;
  first_seen?: string;
  status?: string;
  /** quase = corr flat/soft; out_market = mercado fechado */
  lane?: string;
};

export type PossiblePayload = {
  rows: PossibleRow[];
  quase?: PossibleRow[];
  out_market?: PossibleRow[];
  day?: string;
  retry_min?: number;
  max_tries?: number;
};
