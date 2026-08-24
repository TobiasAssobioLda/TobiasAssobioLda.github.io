import type { PopularPayload } from "./popular-types";

function withBust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const t = Date.now();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${t}`;
}

export function popularTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_POPULAR_URL || "").trim();
  return remote || "/popular.sample.json";
}

export async function fetchPopular(): Promise<PopularPayload> {
  const res = await fetch(withBust(popularTarget()), { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<PopularPayload>;
}
