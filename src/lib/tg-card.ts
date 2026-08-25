/** Linhas estilo Telegram (Rumors / Chill News) — partilhado NOP + Jornal. */

import type { OpenRow } from "@/lib/types";

export const HORSE_EMOJI: Record<string, string> = {
  Trump: "🦅",
  Musk: "🚀",
  Fed: "🏦",
  Buffett: "🎩",
  China: "🐉",
  Índia: "🪷",
  UE: "🇪🇺",
  Venezuela: "🛢️",
  Irão: "☢️",
  Gaza: "🕊️",
  Rússia: "🐻",
  Ucrânia: "🌻",
  Drones: "🛸",
  Inflação: "📈",
  Cripto: "₿",
  Chips: "💾",
  AI: "🤖",
  Nuclear: "💥",
  Ouro: "🥇",
  Prata: "🪙",
  Petróleo: "🛢️",
  Saúde: "💊",
};

export function impactBand(n: number): string {
  if (n >= 90) return "extremo";
  if (n >= 70) return "alto";
  if (n >= 50) return "médio";
  if (n >= 20) return "baixo";
  return "ruído";
}

/** Diagnóstico interno (pending cluster) — não é card Rumors. */
export function isInternalHook(text: string): boolean {
  const s = (text || "").trim();
  if (!s) return false;
  return (
    /pending cluster/i.test(s) ||
    /CHILL_CHASE/i.test(s) ||
    / · sinal /i.test(s) ||
    / · corr /i.test(s) ||
    /^[^:]+:\s*pending/i.test(s)
  );
}

export function newsLines(row: OpenRow): { hook: string; what: string } {
  let hook = (row.news_hook || "").replace(/^🎤\s*/, "").trim();
  const what = (row.news_what || "").trim();
  const blurb = (row.news_blurb || "").trim();

  if (!hook && blurb.startsWith("🎤")) {
    hook = blurb.replace(/^🎤\s*/, "").trim();
  }
  if (!hook && blurb) {
    hook = blurb.split(/\s·\s/)[0].trim();
  }

  if (hook && isInternalHook(hook)) {
    const m = blurb.replace(/^🎤\s*/, "").match(
      /^([A-Za-zÀ-ú0-9]+)\s×\s([^·]+)/
    );
    if (m && !isInternalHook(m[2])) {
      hook = `${m[1]} × ${m[2].trim()}`;
    } else {
      hook = "";
    }
  }

  return { hook, what };
}

export function formatCorr(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  const v = Number(n);
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;
}

export function rumorBadge(bookKey: string): { badge: string; kind: string } {
  if (bookKey === "chill") {
    return { badge: "🧊", kind: "CHILL NEWS" };
  }
  return { badge: "🟠", kind: "RUMOR" };
}
