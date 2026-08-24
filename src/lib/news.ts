import type { NewsPayload } from "./news-types";

export function newsTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_NEWS_URL || "").trim();
  if (remote) return remote;
  return "/news.sample.json";
}

export async function fetchNews(): Promise<NewsPayload> {
  const base = newsTarget();
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const sep = base.includes("?") ? "&" : "?";
  const target = `${base}${sep}v=${encodeURIComponent(build)}&t=${Date.now()}`;
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
