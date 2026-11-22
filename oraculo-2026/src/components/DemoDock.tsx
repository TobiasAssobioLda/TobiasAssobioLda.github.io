import { useState } from 'react';
import { setSimMode } from '../oracle/client';
import type { SimMode } from '../oracle/types';

const MODES: ReadonlyArray<{ id: SimMode; label: string; title: string }> = [
  { id: 'ko10', label: 'KO −10', title: 'Ainda faltam 10 minutos' },
  { id: 'ko9', label: 'KO −9', title: 'Erro de manutenção' },
  { id: 'ko8', label: 'KO −8', title: 'Revelação cinematográfica + TIP' },
];

/**
 * Docas de demonstração (dev control, discreto): escolhe o modo
 * simulado pelo motor local do Oráculo. Predefinição: KO−8.
 */
export default function DemoDock() {
  const [mode, setMode] = useState<SimMode>('ko8');

  return (
    <div className="demo-dock" role="group" aria-label="Modo de demonstração" data-animate>
      <span className="demo-dock-tag">DEMO</span>
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          title={m.title}
          aria-pressed={m.id === mode}
          className={m.id === mode ? 'demo-chip is-on' : 'demo-chip'}
          onClick={() => {
            setSimMode(m.id);
            setMode(m.id);
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
