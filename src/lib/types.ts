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
};

export type BookSnapshot = {
  rows: OpenRow[];
  total_pnl_pct: number;
  total_pnl_eur: number;
};

export type OpensPayload = {
  updated_at: string;
  timezone: string;
  when_label: string;
  pipoca: BookSnapshot;
  chill: BookSnapshot;
};
