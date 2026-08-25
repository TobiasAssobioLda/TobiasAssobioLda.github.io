import type { OpensPayload } from "./types";

/** Raw GitHub primeiro — jsDelivr CDN atrasa. API só fallback. */
const GH_OPENS_CDN =
  "https://cdn.jsdelivr.net/gh/TobiasAssobioLda/TobiasAssobioLda.github.io@main/opens.json";
const GH_OPENS_RAW =
  "https://raw.githubusercontent.com/TobiasAssobioLda/TobiasAssobioLda.github.io/main/opens.json";
const GH_OPENS_API =
  "https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/opens.json";

/** URL pública do JSON. Vazio = CDN / raw / API (fallback). */
export function opensUrl(): string {
  return (process.env.NEXT_PUBLIC_OPENS_URL || "").trim();
}

function bust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${Date.now()}`;
}

function targets(): { url: string; headers?: HeadersInit }[] {
  const configured = opensUrl();
  const cdn = { url: bust(GH_OPENS_CDN) };
  const raw = { url: bust(GH_OPENS_RAW) };
  const api = {
    url: bust(`${GH_OPENS_API}?ref=main`),
    headers: { Accept: "application/vnd.github.raw+json" } as HeadersInit,
  };

  // Raw GitHub primeiro (fresco). CDN jsDelivr atrasa minutos/horas.
  if (!configured) {
    return [raw, cdn, api];
  }
  if (
    configured.includes("raw.githubusercontent.com") ||
    configured.includes("github.io") ||
    configured.includes("jsdelivr")
  ) {
    return [raw, cdn, api];
  }
  return [{ url: bust(configured) }, raw, cdn, api];
}

export async function fetchOpens(): Promise<OpensPayload> {
  let lastErr: Error | null = null;
  for (const { url, headers } of targets()) {
    try {
      const res = await fetch(url, { cache: "no-store", headers });
      if (!res.ok) {
        lastErr = new Error(`opens fetch ${res.status}`);
        continue;
      }
      const data = (await res.json()) as OpensPayload;
      if (!data?.pipoca && !data?.chill) {
        lastErr = new Error("opens invalid payload");
        continue;
      }
      return data;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("opens fetch failed");
}
