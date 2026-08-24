"use client";

import { useEffect, useState } from "react";
import { msUntilLive, siteLiveAt } from "@/lib/site-live";

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "já";
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtWhen(d: Date): string {
  return d.toLocaleString("pt-PT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  });
}

export function ComingSoon() {
  const liveAt = siteLiveAt();
  const [left, setLeft] = useState(() => msUntilLive());

  useEffect(() => {
    const id = window.setInterval(() => setLeft(msUntilLive()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="soon-page">
      <header className="soon-masthead">
        <p className="soon-eyebrow">Vol. 1 · Viseu</p>
        <div className="paper-rule double" />
        <h1 className="soon-brand">O Rumors</h1>
        <p className="soon-tag">geopolítica &amp; mercados</p>
        <div className="paper-rule double" />
      </header>
      <section className="soon-body">
        <p className="soon-lead">O site abre em breve.</p>
        <p className="soon-count">{fmtCountdown(left)}</p>
        {liveAt ? (
          <p className="soon-when">previsto · {fmtWhen(liveAt)} (Lisboa)</p>
        ) : null}
        <p className="soon-note">
          Opens · posições · jornal — quando o bot começar a correr a sério.
        </p>
      </section>
    </main>
  );
}
