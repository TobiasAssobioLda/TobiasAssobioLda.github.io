import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Hourglass, RefreshCw, RotateCcw, TriangleAlert, Wrench } from 'lucide-react';
import type { OracleResponse } from '../oracle/types';

export type PanelState = { type: 'oracle'; response: OracleResponse } | { type: 'error' };

interface ResultPanelProps {
  state: PanelState;
  onReset: () => void;
  onRetry: () => void;
  reducedMotion: boolean;
}

/**
 * Cartão de resultado sobre a zona inferior do orbe.
 * KO−10 (cedo demais) · KO−9 (manutenção) · TIP demonstrativa · erro.
 */
export default function ResultPanel({ state, onReset, onRetry, reducedMotion }: ResultPanelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { y: 26, autoAlpha: 0, scale: 0.95 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.55, ease: 'power3.out' },
      );
      gsap.fromTo(
        '.rp-stagger',
        { y: 10, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.06, delay: 0.14, ease: 'power2.out' },
      );
    }, ref);
    return () => ctx.revert();
  }, [reducedMotion, state]);

  const resetButton = (
    <button type="button" className="btn-ghost" onClick={onReset}>
      <RotateCcw size={13} aria-hidden />
      Nova consulta
    </button>
  );

  if (state.type === 'error') {
    return (
      <div className="result-panel" ref={ref} role="alert">
        <p className="rp-tag rp-stagger">
          <TriangleAlert size={12} aria-hidden />
          SINAL PERDIDO
        </p>
        <h2 className="rp-title rp-stagger">O Oráculo baralhou-se.</h2>
        <p className="rp-msg rp-stagger">Tenta outra vez.</p>
        <div className="rp-actions rp-stagger">
          <button type="button" className="btn-ghost" onClick={onRetry}>
            <RefreshCw size={13} aria-hidden />
            Tentar de novo
          </button>
          {resetButton}
        </div>
      </div>
    );
  }

  const { response } = state;

  if (response.kind === 'too-early') {
    return (
      <div className="result-panel" ref={ref}>
        <p className="rp-tag rp-stagger">
          <Hourglass size={12} aria-hidden />
          KO −{response.minutesToKickoff} MIN
        </p>
        <h2 className="rp-title rp-stagger">{response.headline}</h2>
        <p className="rp-msg rp-stagger">{response.message}</p>
        <div className="rp-actions rp-stagger">{resetButton}</div>
      </div>
    );
  }

  if (response.kind === 'maintenance') {
    return (
      <div className="result-panel" ref={ref}>
        <p className="rp-tag rp-stagger">
          <Wrench size={12} aria-hidden />
          KO −9 MIN
        </p>
        <h2 className="rp-title rp-stagger">{response.headline}</h2>
        <p className="rp-msg rp-stagger">{response.message}</p>
        <div className="rp-actions rp-stagger">{resetButton}</div>
      </div>
    );
  }

  return null; // The KO-8 decision is drawn by Prophecy, not by this panel.
}
