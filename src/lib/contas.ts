import type { ContasPayload } from "./contas-types";

const GH_CDN =
  "https://cdn.jsdelivr.net/gh/TobiasAssobioLda/TobiasAssobioLda.github.io@main/contas.json";
const GH_RAW =
  "https://raw.githubusercontent.com/TobiasAssobioLda/TobiasAssobioLda.github.io/main/contas.json";
const GH_API =
  "https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/contas.json";

function bust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${Date.now()}`;
}

function targets(): { url: string; headers?: HeadersInit }[] {
  const configured = (process.env.NEXT_PUBLIC_CONTAS_URL || "").trim();
  const cdn = { url: bust(GH_CDN) };
  const raw = { url: bust(GH_RAW) };
  const api = {
    url: bust(`${GH_API}?ref=main`),
    headers: { Accept: "application/vnd.github.raw+json" } as HeadersInit,
  };
  if (!configured) return [cdn, raw, api];
  return [{ url: bust(configured) }, cdn, raw, api];
}

export async function fetchContas(): Promise<ContasPayload> {
  let lastErr: Error | null = null;
  for (const { url, headers } of targets()) {
    try {
      const res = await fetch(url, { cache: "no-store", headers });
      if (!res.ok) {
        lastErr = new Error(`contas ${res.status}`);
        continue;
      }
      const data = (await res.json()) as ContasPayload;
      if (!data?.pipoca && !data?.chill) {
        lastErr = new Error("contas invalid");
        continue;
      }
      return data;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("contas fetch failed");
}
