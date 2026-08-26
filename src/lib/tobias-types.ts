export type TobiasRow = {
  id: number;
  book: string;
  book_label: string;
  ticker: string;
  horse?: string;
  kind: "tp" | "sl" | "out" | string;
  label: string;
  entry: number;
  exit: number;
  sl: number;
  tp1: number;
  pnl_eur: number;
  pnl_pct: number;
  pnl_r: number;
  corr: number;
  impact: number;
  exit_reason: string;
  opened_at?: string;
  closed_at?: string;
  news_hook?: string;
};

export type TobiasStats = {
  n: number;
  tp: number;
  sl: number;
  out: number;
  correto: number;
  erro: number;
  trainable: number;
  realized_eur: number;
  realized_r: number;
};

export type TobiasPayload = {
  updated_at: string;
  timezone: string;
  when_label: string;
  title?: string;
  note?: string;
  stats: TobiasStats;
  rows: TobiasRow[];
  page_sizes?: number[];
};
