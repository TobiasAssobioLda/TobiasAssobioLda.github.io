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
  when_label?: string;
  read_url?: string;
};

export type PaperPayload = {
  day: string;
  published_at: string;
  timezone: string;
  cutoff: string;
  count: number;
  masthead: string;
  tagline: string;
  lead_uid: string;
  items: PaperItem[];
  archive_days: string[];
};
