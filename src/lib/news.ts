import type { NewsPayload } from "./news-types";

export function newsTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_NEWS_URL || "").trim();
  if (remote) return remote;
  return "/news.sample.json";
}

export async function fetchNews(): Promise<NewsPayload> {
  const target = newsTarget();
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<NewsPayload>;
}

export function impactBand(impact: number): string {
  if (impact >= 90) return "extremo";
  if (impact >= 70) return "alto";
  if (impact >= 50) return "médio";
  if (impact >= 20) return "baixo";
  return "ruído";
}
