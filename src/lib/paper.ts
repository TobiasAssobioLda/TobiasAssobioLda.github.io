import type { PaperPayload } from "./paper-types";

const GH_PAPER_CDN =
  "https://cdn.jsdelivr.net/gh/TobiasAssobioLda/TobiasAssobioLda.github.io@main/paper.json";
const GH_PAPER_RAW =
  "https://raw.githubusercontent.com/TobiasAssobioLda/TobiasAssobioLda.github.io/main/paper.json";
const GH_PAPER_API =
  "https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/paper.json";

function withBust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const t = Date.now();
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${t}`;
}

export function paperTarget(day?: string): string {
  const remote = (process.env.NEXT_PUBLIC_PAPER_URL || "").trim();
  if (day && remote.includes("paper.json")) {
    return remote.replace(/paper\.json(?:\?.*)?$/, `paper/paper_${day}.json`);
  }
  if (remote && !day) return remote;
  if (!day) return GH_PAPER_RAW;
  return `/paper.sample.json`;
}

function paperFetchTargets(day?: string): { url: string; headers?: HeadersInit }[] {
  if (day) {
    const remote = (process.env.NEXT_PUBLIC_PAPER_URL || "").trim();
    if (remote.includes("paper.json")) {
      const url = remote.replace(
        /paper\.json(?:\?.*)?$/,
        `paper/paper_${day}.json`,
      );
      const dayFile = `paper_${day}.json`;
      const cdn = withBust(
        `https://cdn.jsdelivr.net/gh/TobiasAssobioLda/TobiasAssobioLda.github.io@main/paper/${dayFile}`,
      );
      const raw = withBust(
        `https://raw.githubusercontent.com/TobiasAssobioLda/TobiasAssobioLda.github.io/main/paper/${dayFile}`,
      );
      const api = {
        url: withBust(
          `https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/paper/${dayFile}?ref=main`,
        ),
        headers: {
          Accept: "application/vnd.github.raw+json",
        } as HeadersInit,
      };
      if (
        url.includes("raw.githubusercontent.com") ||
        url.includes("jsdelivr") ||
        url.includes("github.io")
      ) {
        return [{ url: raw }, { url: cdn }, api];
      }
      return [{ url: withBust(url) }, { url: raw }, { url: cdn }, api];
    }
    return [{ url: withBust("/paper.sample.json") }];
  }

  const remote = (process.env.NEXT_PUBLIC_PAPER_URL || "").trim();
  const cdn = { url: withBust(GH_PAPER_CDN) };
  const raw = { url: withBust(GH_PAPER_RAW) };
  const api = {
    url: withBust(`${GH_PAPER_API}?ref=main`),
    headers: { Accept: "application/vnd.github.raw+json" } as HeadersInit,
  };

  if (!remote) {
    return [raw, cdn, api];
  }
  if (
    remote.includes("raw.githubusercontent.com") ||
    remote.includes("jsdelivr") ||
    remote.includes("github.io")
  ) {
    return [raw, cdn, api];
  }
  return [{ url: withBust(remote) }, raw, cdn, api];
}

export async function fetchPaper(day?: string): Promise<PaperPayload> {
  let lastErr: Error | null = null;
  for (const { url, headers } of paperFetchTargets(day)) {
    try {
      const res = await fetch(url, { cache: "no-store", headers });
      if (!res.ok) {
        lastErr = new Error(String(res.status));
        continue;
      }
      return (await res.json()) as PaperPayload;
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr || new Error("paper fetch failed");
}
