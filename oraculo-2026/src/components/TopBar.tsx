import { FlaskConical, Sparkles } from 'lucide-react';

/**
 * Barra superior: marca da Federação + selo de demonstração.
 */
export default function TopBar() {
  return (
    <header className="topbar" data-animate>
      <div className="brand">
        <span className="brand-sigil" aria-hidden>
          <Sparkles size={18} strokeWidth={1.8} />
        </span>
        <span className="brand-text">
          <strong>FEDERAÇÃO</strong>
          <span>✦ ORÁCULO 2026</span>
        </span>
      </div>
      <span className="demo-pill">
        <FlaskConical size={12} aria-hidden />
        EXPERIÊNCIA DEMO
      </span>
    </header>
  );
}
