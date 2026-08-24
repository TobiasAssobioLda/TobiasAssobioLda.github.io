/** Quando o site mostra Opens/Jornal (antes = landing). ISO com timezone. */
export function siteLiveAt(): Date | null {
  const raw = (process.env.NEXT_PUBLIC_SITE_LIVE_AT || "").trim();
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isSiteLive(now = new Date()): boolean {
  const at = siteLiveAt();
  if (!at) return true;
  return now.getTime() >= at.getTime();
}

export function msUntilLive(now = new Date()): number {
  const at = siteLiveAt();
  if (!at) return 0;
  return Math.max(0, at.getTime() - now.getTime());
}
