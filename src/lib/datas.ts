import type { DatasPayload } from "./datas-types";

function withBust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const t = Date.now();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${t}`;
}

export function datasTarget(): string {
  const remote = (process.env.NEXT_PUBLIC_DATAS_URL || "").trim();
  return remote || "/datas.sample.json";
}

export async function fetchDatas(): Promise<DatasPayload> {
  const res = await fetch(withBust(datasTarget()), { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<DatasPayload>;
}
