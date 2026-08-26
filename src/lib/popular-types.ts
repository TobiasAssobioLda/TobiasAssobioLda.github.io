export type PopularRow = {
  rank: number;
  ticker: string;
  total: number;
  as_up: number;
  as_down: number;
  last_horse: string;
};

export type PopularWindowKey = "week" | "pre" | "day";

export type PopularWindow = {
  key: PopularWindowKey | string;
  label: string;
  from: string;
  to: string;
  from_label?: string;
  to_label?: string;
  n_events: number;
  top5_count: number;
  top6_20_count: number;
  top5: PopularRow[];
  top6_20: PopularRow[];
};

export type PopularPayload = {
  updated_at: string;
  timezone: string;
  default_window?: PopularWindowKey | string;
  windows?: Partial<Record<PopularWindowKey, PopularWindow>> &
    Record<string, PopularWindow | undefined>;
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
