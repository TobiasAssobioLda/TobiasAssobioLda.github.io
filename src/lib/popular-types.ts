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
  top5_count: number;
  top6_20_count: number;
  top5: PopularRow[];
  top6_20: PopularRow[];
  /** @deprecated use top5 + top6_20 */
  count?: number;
  /** @deprecated */
  rows?: PopularRow[];
};
