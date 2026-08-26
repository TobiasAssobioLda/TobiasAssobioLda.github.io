import type { PopularPayload } from "./popular-types";

const GH_CDN =
  "https://cdn.jsdelivr.net/gh/TobiasAssobioLda/TobiasAssobioLda.github.io@main/popular.json";
const GH_RAW =
  "https://raw.githubusercontent.com/TobiasAssobioLda/TobiasAssobioLda.github.io/main/popular.json";
const GH_API =
  "https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/popular.json";

function bust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${Date.now()}`;
}

function targets(): { url: string; headers?: HeadersInit }[] {
  const configured = (process.env.NEXT_PUBLIC_POPULAR_URL || "").trim();
  const cdn = { url: bust(GH_CDN) };
  const raw = { url: bust(GH_RAW) };
  const api = {
    url: bust(`${GH_API}?ref=main`),
    headers: { Accept: "application/vnd.github.raw+json" } as HeadersInit,
  };
  if (!configured) return [raw, cdn, api, { url: bust("/popular.sample.json") }];
  return [
    { url: bust(configured) },
    raw,
    cdn,
    api,
    { url: bust("/popular.sample.json") },
  ];
}

export async function fetchPopular(): Promise<PopularPayload> {
  let lastErr: Error | null = null;
  for (const { url, headers } of targets()) {
    try {
      const res = await fetch(url, { cache: "no-store", headers });
      if (!res.ok) {
        lastErr = new Error(`popular ${res.status}`);
        continue;
      }
      const data = (await res.json()) as PopularPayload;
      if (!data?.top5 && !data?.windows && !data?.rows) {
        lastErr = new Error("popular invalid");
        continue;
      }
      return data;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("popular fetch failed");
}
