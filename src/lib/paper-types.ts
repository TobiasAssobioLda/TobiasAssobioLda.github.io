export type PaperItem = {
  uid: string;
  title: string;
  url: string;
  source: string;
  horse: string;
  sent_at: string;
  impact: number;
  hook: string;
  what: string;
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
