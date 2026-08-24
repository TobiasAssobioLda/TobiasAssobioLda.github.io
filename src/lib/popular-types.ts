export type PopularRow = {
  rank: number;
  ticker: string;
  total: number;
  as_up: number;
  as_down: number;
  last_horse: string;
};

export type PopularPayload = {
  updated_at: string;
  timezone: string;
  days: number;
  n_events: number;
  count: number;
  rows: PopularRow[];
};
