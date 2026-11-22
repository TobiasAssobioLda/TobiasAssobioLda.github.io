/**
 * Federação Oráculo 2026 — orbe de recurso em CSS puro.
 *
 * Renderizado quando WebGL não está disponível. Tudo é inline porque
 * src/scene/ não pode editar styles.css. Reage à fase com gradientes,
 * sombras e brilho diferentes + respiração subtil via intervalo.
 */
import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import type { OraclePhase } from '../oracle/types';

interface FallbackOrbProps {
  phase: OraclePhase;
  reducedMotion: boolean;
}

interface FallbackLook {
  orb: string;
  halo: string;
  rim: string;
  shadow: string;
}

const LOOKS: Record<OraclePhase, FallbackLook> = {
  idle: {
    orb: 'radial-gradient(circle at 38% 32%, #4b2a9e 0%, #2a1660 45%, #110827 100%)',
    halo: 'radial-gradient(circle, rgba(93,45,215,0.55) 0%, rgba(93,45,215,0.12) 55%, rgba(0,0,0,0) 75%)',
    rim: 'radial-gradient(circle at 30% 24%, rgba(190,160,255,0.4) 0%, rgba(190,160,255,0) 55%)',
    shadow:
      '0 0 70px 18px rgba(125,49,251,0.35), inset 0 0 60px rgba(77,141,255,0.22), inset -12px -18px 60px rgba(0,0,0,0.55)',
  },
  consulting: {
    orb: 'radial-gradient(circle at 40% 32%, #3f46b8 0%, #232a7d 45%, #0c0f33 100%)',
    halo: 'radial-gradient(circle, rgba(77,141,255,0.55) 0%, rgba(77,141,255,0.12) 55%, rgba(0,0,0,0) 75%)',
    rim: 'radial-gradient(circle at 30% 24%, rgba(160,190,255,0.45) 0%, rgba(160,190,255,0) 55%)',
    shadow:
      '0 0 80px 20px rgba(77,141,255,0.4), inset 0 0 60px rgba(125,49,251,0.28), inset -12px -18px 60px rgba(0,0,0,0.5)',
  },
  charging: {
    orb: 'radial-gradient(circle at 46% 40%, #b28cff 0%, #6a2fe0 38%, #1b0b45 100%)',
    halo: 'radial-gradient(circle, rgba(140,90,255,0.7) 0%, rgba(140,90,255,0.18) 55%, rgba(0,0,0,0) 78%)',
    rim: 'radial-gradient(circle at 32% 26%, rgba(230,215,255,0.6) 0%, rgba(230,215,255,0) 58%)',
    shadow:
      '0 0 120px 30px rgba(125,49,251,0.65), inset 0 0 70px rgba(160,120,255,0.45), inset -10px -16px 55px rgba(0,0,0,0.45)',
  },
  revealed: {
    orb: 'radial-gradient(circle at 40% 32%, #8a5adf 0%, #3c1f7a 52%, #170a33 100%)',
    halo: 'radial-gradient(circle, rgba(255,210,125,0.5) 0%, rgba(125,49,251,0.16) 55%, rgba(0,0,0,0) 78%)',
    rim: 'radial-gradient(circle at 30% 24%, rgba(255,230,180,0.55) 0%, rgba(255,230,180,0) 55%)',
    shadow:
      '0 0 100px 24px rgba(255,210,125,0.45), inset 0 0 70px rgba(255,210,125,0.3), inset -12px -18px 60px rgba(0,0,0,0.5)',
  },
};

export default function FallbackOrb({ phase, reducedMotion }: FallbackOrbProps): JSX.Element {
  const look = LOOKS[phase];
  const [breath, setBreath] = useState(0);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const id = window.setInterval(() => {
      setBreath(Math.sin(performance.now() / 1400));
    }, 80);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const scale = 1 + (reducedMotion ? 0 : breath * 0.015);
  const chargeBoost = phase === 'charging' && !reducedMotion ? 0.03 : 0;
  const transition =
    'background 0.9s ease, box-shadow 0.9s ease, transform 0.25s ease, opacity 0.9s ease';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative', width: '52vmin', height: '52vmin' }}>
        <div
          style={{
            position: 'absolute',
            inset: '-20%',
            borderRadius: '50%',
            background: look.halo,
            filter: 'blur(26px)',
            transform: `scale(${scale + chargeBoost})`,
            transition,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: look.orb,
            boxShadow: look.shadow,
            transform: `scale(${scale + chargeBoost})`,
            transition,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: '5%',
            borderRadius: '50%',
            background: look.rim,
            mixBlendMode: 'screen',
            transform: `scale(${scale})`,
            transition,
          }}
        />
      </div>
    </div>
  );
}
