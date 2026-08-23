import type { OpensPayload } from "./types";

/** URL pública do JSON (Kamatera / CDN). Vazio = sample em /opens.sample.json */
export function opensUrl(): string {
  return (process.env.NEXT_PUBLIC_OPENS_URL || "").trim();
}

export async function fetchOpens(): Promise<OpensPayload> {
  const url = opensUrl();
  const target = url || "/opens.sample.json";
  const res = await fetch(target, {
    next: { revalidate: 60 },
    cache: url ? "no-store" : "force-cache",
  });
  if (!res.ok) {
    throw new Error(`opens fetch ${res.status}`);
  }
  return res.json() as Promise<OpensPayload>;
}
