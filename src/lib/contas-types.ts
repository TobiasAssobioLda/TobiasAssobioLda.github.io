export type ContasTrade = {
  id: number;
  ticker: string;
  horse?: string;
  qty: number;
  entry: number;
  exit: number;
  sl?: number;
  tp1?: number;
  notional?: number;
  opened_at?: string;
  closed_at?: string;
  exit_reason?: string;
  pnl_eur: number;
  pnl_pct: number;
  pnl_r: number;
  news_impact?: number;
};

export type ContasBook = {
  book: string;
  label: string;
  bank_eur: number;
  equity_eur: number;
  open_count: number;
  open_notional: number;
  open_pnl_eur: number;
  closed_count: number;
  realized_eur: number;
  realized_r: number;
  wins: number;
  losses: number;
  win_rate: number;
  closed: ContasTrade[];
};

export type ContasPayload = {
  updated_at: string;
  timezone: string;
  when_label: string;
  pipoca: ContasBook;
  chill: ContasBook;
  pipoca_all: ContasBook;
  max?: ContasBook;
  rumors?: ContasBook;
};
