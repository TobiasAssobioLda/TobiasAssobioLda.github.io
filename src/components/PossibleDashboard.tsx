import type { PossiblePayload, PossibleRow } from "@/lib/types";

function fmtWhen(iso: string): string {
  if (!iso || iso.length < 16) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-PT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(11, 16);
  }
}

function shortReason(r: string): string {
  const s = (r || "").trim();
  if (!s) return "—";
  if (s.length <= 52) return s;
  return s.slice(0, 49) + "…";
}

function Table({
  rows,
  maxT,
  empty,
}: {
  rows: PossibleRow[];
  maxT: number;
  empty: string;
}) {
  if (!rows.length) {
    return <p className="empty">{empty}</p>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Activo</th>
            <th>Book</th>
            <th>i</th>
            <th>Try</th>
            <th>Prox</th>
            <th>Porquê</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: PossibleRow) => (
            <tr key={`${r.lane || "q"}-${r.book}-${r.ticker}-${r.first_seen}`}>
              <td className="ticker">{r.ticker}</td>
              <td>{r.book}</td>
              <td>{r.impact}</td>
              <td>
                {r.tries}/{r.max_tries || maxT}
              </td>
              <td>{fmtWhen(r.next_check || "")}</td>
              <td className="cell-title">{shortReason(r.reason || "")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PossibleDashboard({
  data,
  updatedAt,
}: {
  data: PossiblePayload;
  updatedAt?: string;
}) {
  const retry = data.retry_min ?? 15;
  const maxT = data.max_tries ?? 6;
  const day = data.day || "hoje";

  const quase =
    data.quase ||
    (data.rows || []).filter((r) => (r.lane || "quase") !== "out_market");
  const out =
    data.out_market ||
    (data.rows || []).filter((r) => r.lane === "out_market");

  return (
    <main className="page">
      <header>
        <h1>Possible</h1>
        <p className="meta">
          sem Alpaca · retry {retry} min · máx {maxT}
          {updatedAt ? ` · ${updatedAt.slice(11, 16)}` : ""}
        </p>
      </header>

      <section className="book">
        <h2>
          Quase lá <span className="count">{quase.length}</span>
          <span className="count"> · {day}</span>
        </h2>
        <p className="meta" style={{ marginTop: "-0.4rem", marginBottom: "0.7rem" }}>
          mercado aberto · corr flat/soft · à espera de aquecer
        </p>
        <Table rows={quase} maxT={maxT} empty="sem quase-lá hoje" />
      </section>

      <section className="book">
        <h2>
          Out Market <span className="count">{out.length}</span>
        </h2>
        <p className="meta" style={{ marginTop: "-0.4rem", marginBottom: "0.7rem" }}>
          critérios ok · mercado fechado · tendência; só tenta Alpaca em RTH
        </p>
        <Table rows={out} maxT={maxT} empty="sem out-market hoje" />
      </section>

      <footer>
        Pipoca/Chill não abrem Alpaca com mercado fechado. Out Market vira
        tentativa real quando a bolsa abrir. Quase lá morre se corr reject ou
        esgotar tentativas. Limpa à meia-noite.
      </footer>
    </main>
  );
}
