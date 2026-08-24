import type { PaperPayload } from "./paper-types";

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
  // Sem secret: paper.json na raiz do github.io (API evita CDN stale)
  if (!day) return GH_PAPER_API;
  return `/paper.sample.json`;
}

function paperFetchTarget(day?: string): { url: string; headers?: HeadersInit } {
  if (day) {
    const remote = (process.env.NEXT_PUBLIC_PAPER_URL || "").trim();
    if (remote.includes("paper.json")) {
      const url = remote.replace(
        /paper\.json(?:\?.*)?$/,
        `paper/paper_${day}.json`,
      );
      if (url.includes("raw.githubusercontent.com")) {
        const api = `https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/paper/paper_${day}.json?ref=main`;
        return {
          url: withBust(api),
          headers: { Accept: "application/vnd.github.raw+json" },
        };
      }
      return { url: withBust(url) };
    }
    return { url: withBust("/paper.sample.json") };
  }

  const remote = (process.env.NEXT_PUBLIC_PAPER_URL || "").trim();
  if (!remote) {
    return {
      url: withBust(`${GH_PAPER_API}?ref=main`),
      headers: { Accept: "application/vnd.github.raw+json" },
    };
  }
  if (
    remote.includes("raw.githubusercontent.com") &&
    remote.includes("paper.json")
  ) {
    return {
      url: withBust(`${GH_PAPER_API}?ref=main`),
      headers: { Accept: "application/vnd.github.raw+json" },
    };
  }
  return { url: withBust(remote) };
}

export async function fetchPaper(day?: string): Promise<PaperPayload> {
  const { url, headers } = paperFetchTarget(day);
  const res = await fetch(url, { cache: "no-store", headers });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<PaperPayload>;
}
