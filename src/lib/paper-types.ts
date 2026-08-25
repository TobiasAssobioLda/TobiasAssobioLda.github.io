export type PaperItem = {
  uid: string;
  title: string;
  url: string;
  source: string;
  horse: string;
  horse_emoji?: string;
  sent_at: string;
  impact: number;
  impact_band?: string;
  kind?: string;
  badge?: string;
  hook: string;
  what: string;
  up?: string;
  down?: string;
  vibe?: string;
  ticker_up?: string;
  ticker_down?: string;
  when_label?: string;
  read_url?: string;
};

export type PaperPayload = {
  day: string;
  published_at: string;
  timezone: string;
  cutoff: string;
  window?: string;
  max_items?: number;
  count: number;
  masthead: string;
  tagline: string;
  lead_uid: string;
  items: PaperItem[];
  archive_days: string[];
};
