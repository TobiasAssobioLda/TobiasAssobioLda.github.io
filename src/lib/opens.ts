import type { OpensPayload } from "./types";

const GH_OPENS_API =
  "https://api.github.com/repos/TobiasAssobioLda/TobiasAssobioLda.github.io/contents/opens.json";

/** URL pública do JSON. Vazio = GitHub API (sempre fresco). */
export function opensUrl(): string {
  return (process.env.NEXT_PUBLIC_OPENS_URL || "").trim();
}

function bust(url: string): string {
  const build = (process.env.NEXT_PUBLIC_BUILD_ID || "dev").slice(0, 7);
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(build)}&t=${Date.now()}`;
}

/** raw.githubusercontent.com cacheia agressivo — API GitHub traz sempre o último commit. */
function opensFetchTarget(): { url: string; headers?: HeadersInit } {
  const configured = opensUrl();
  if (!configured) {
    return {
      url: bust(`${GH_OPENS_API}?ref=main`),
      headers: { Accept: "application/vnd.github.raw+json" },
    };
  }
  if (
    configured.includes("raw.githubusercontent.com") &&
    configured.includes("opens.json")
  ) {
    return {
      url: bust(`${GH_OPENS_API}?ref=main`),
      headers: {
        Accept: "application/vnd.github.raw+json",
      },
    };
  }
  // github.io/opens.json 404 (Pages só serve /out) → API
  if (
    configured.includes("github.io") &&
    configured.includes("opens.json")
  ) {
    return {
      url: bust(`${GH_OPENS_API}?ref=main`),
      headers: { Accept: "application/vnd.github.raw+json" },
    };
  }
  return { url: bust(configured) };
}

export async function fetchOpens(): Promise<OpensPayload> {
  const { url, headers } = opensFetchTarget();
  const res = await fetch(url, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    throw new Error(`opens fetch ${res.status}`);
  }
  return res.json() as Promise<OpensPayload>;
}
