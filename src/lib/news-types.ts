export type NewsItem = {
  uid: string;
  title: string;
  url: string;
  source: string;
  horse: string;
  sent_at: string;
  impact: number;
  when_label: string;
  read_url: string;
};

export type NewsPayload = {
  updated_at: string;
  timezone: string;
  count: number;
  items: NewsItem[];
};
