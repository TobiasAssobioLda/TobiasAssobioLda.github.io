"use client";

import { useMemo, useState } from "react";
import type { TobiasPayload, TobiasRow } from "@/lib/tobias-types";

const SIZES = [10, 20, 30] as const;

function fmtEur(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)} €`;
}

function fmtWhen(iso: string): string {
  if (!iso || iso.length < 16) return "—";
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function kindBadge(kind: string): { text: string; cls: string } {
  if (kind === "tp") return { text: "TP", cls: "badge-tp" };
  if (kind === "sl") return { text: "SL", cls: "badge-sl" };
  return { text: "OUT", cls: "badge-out" };
}

function RowCard({ r }: { r: TobiasRow }) {
  const b = kindBadge(r.kind);
  return (
    <article className={`tobias-row ${r.kind === "tp" ? "is-tp" : ""}`}>
      <div className="tobias-row-top">
        <span className={`badge ${b.cls}`}>{b.text}</span>
        <span className="ticker">{r.ticker}</span>
        <span className="muted">{r.book_label}</span>
        <span className="muted push">{fmtWhen(r.closed_at || "")}</span>
      </div>
      <div className="tobias-row-main">
        <span className={r.pnl_r >= 0 ? "pos" : "neg"}>
          {r.pnl_r >= 0 ? "+" : ""}
          {r.pnl_r.toFixed(2)}R
        </span>
        <span className={r.pnl_eur >= 0 ? "pos" : "neg"}>{fmtEur(r.pnl_eur)}</span>
        <span className="muted">
          i{r.impact || "—"} · corr {r.corr >= 0 ? "+" : ""}
          {r.corr.toFixed(2)}
        </span>
        <span className="label-pill">{r.label || "—"}</span>
      </div>
      <p className="tobias-reason">{r.exit_reason || "—"}</p>
    </article>
  );
}

export function TobiasDashboard({
  data,
}: {
  data: TobiasPayload;
}) {
  const sizes = data.page_sizes?.length ? data.page_sizes : [...SIZES];
  const [size, setSize] = useState<number>(sizes[0] || 10);
  const st = data.stats;
  const visible = useMemo(
    () => (data.rows || []).slice(0, size),
    [data.rows, size],
  );

  return (
    <main className="page">
      <header>
        <p className="brand">Trade1</p>
        <h1>Full Report</h1>
        <p className="meta">
          Tobias · fechos · TP no topo
          {data.updated_at ? ` · act. ${data.updated_at.slice(11, 16)}` : ""}
        </p>
      </header>

      <dl className="contas-summary">
        <div>
          <dt>Fechos</dt>
          <dd>{st?.n ?? 0}</dd>
        </div>
        <div>
          <dt>TP</dt>
          <dd className="pos">{st?.tp ?? 0}</dd>
        </div>
        <div>
          <dt>SL</dt>
          <dd className="neg">{st?.sl ?? 0}</dd>
        </div>
        <div>
          <dt>Treino</dt>
          <dd>
            {st?.correto ?? 0}✓ / {st?.erro ?? 0}✗
          </dd>
        </div>
        <div>
          <dt>Σ €</dt>
          <dd className={(st?.realized_eur ?? 0) >= 0 ? "pos" : "neg"}>
            {fmtEur(st?.realized_eur ?? 0)}
          </dd>
        </div>
        <div>
          <dt>Σ R</dt>
          <dd className={(st?.realized_r ?? 0) >= 0 ? "pos" : "neg"}>
            {(st?.realized_r ?? 0) >= 0 ? "+" : ""}
            {(st?.realized_r ?? 0).toFixed(2)}R
          </dd>
        </div>
      </dl>

      <nav className="tabs subtabs tobias-sizes" aria-label="Quantos fechos">
        {sizes.map((n) => (
          <button
            key={n}
            type="button"
            className={size === n ? "tab active" : "tab"}
            onClick={() => setSize(n)}
          >
            {n}
          </button>
        ))}
      </nav>

      <section className="book tobias-list">
        <h2>
          Relatório <span className="count">{visible.length}/{st?.n ?? 0}</span>
        </h2>
        {!visible.length ? (
          <p className="empty">ainda sem fechos — Tobias à espera de TP/SL</p>
        ) : (
          <div className="tobias-cards">
            {visible.map((r) => (
              <RowCard key={`${r.book}-${r.id}-${r.closed_at}`} r={r} />
            ))}
          </div>
        )}
      </section>
      <footer>Cada fecho conta · TP = ouro para o Tobias.</footer>
    </main>
  );
}
