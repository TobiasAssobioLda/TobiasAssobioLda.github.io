import type { PaperPayload } from "./paper-types";

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
  return "/paper.sample.json";
}

export async function fetchPaper(day?: string): Promise<PaperPayload> {
  const target = withBust(paperTarget(day));
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<PaperPayload>;
}
