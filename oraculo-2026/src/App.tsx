import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import CrystalBall from './scene/LivingCrystal';
import { oracle } from './oracle/client';
import { resolveTeam } from './oracle/teams';
import type { OraclePhase, TeamRef } from './oracle/types';
import { useQuality } from './fx/quality';
import TopBar from './components/TopBar';
import SearchBar from './components/SearchBar';
import ResultPanel from './components/ResultPanel';
import type { PanelState } from './components/ResultPanel';
import DemoDock from './components/DemoDock';

/** Duração mínima da fase 'charging' — a revelação merece suspense. */
const CHARGE_MS = 2600;

/**
 * Federação Oráculo 2026 — experiência cinematográfica única.
 *
 * Máquina de estados:
 *   idle → consulting → (KO−10 | KO−9 | erro) → painel + idle
 *                     → (KO−8 decision) → charging (≥2.6s) → revealed + TIP
 */
export default function App() {
  const { tier, reducedMotion } = useQuality();

  const [phase, setPhase] = useState<OraclePhase>('idle');
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState<PanelState | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);
  const teamRef = useRef<TeamRef | null>(null);
  const chargeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const consult = useCallback(async (team: TeamRef) => {
    teamRef.current = team;
    const seq = ++seqRef.current;
    if (chargeTimer.current) {
      clearTimeout(chargeTimer.current);
      chargeTimer.current = null;
    }
    setPanel(null);
    setPhase('consulting');
    try {
      const res = await oracle.consult(team);
      if (seq !== seqRef.current) return;
      if (res.kind === 'decision') {
        // KO−8: entra imediatamente em 'charging' (o orbe carrega),
        // e só revela a TIP passado o mínimo cinematográfico.
        setPhase('charging');
        chargeTimer.current = setTimeout(() => {
          chargeTimer.current = null;
          if (seq !== seqRef.current) return;
          setPanel({ type: 'oracle', response: res });
          setPhase('revealed');
        }, CHARGE_MS);
      } else {
        setPanel({ type: 'oracle', response: res });
        setPhase('idle');
      }
    } catch {
      if (seq !== seqRef.current) return;
      setPanel({ type: 'error' });
      setPhase('idle');
    }
  }, []);

  const reset = useCallback(() => {
    seqRef.current++;
    if (chargeTimer.current) {
      clearTimeout(chargeTimer.current);
      chargeTimer.current = null;
    }
    setPhase('idle');
    setPanel(null);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const pickTeam = useCallback(
    (team: TeamRef) => {
      setQuery(team.name);
      void consult(team);
    },
    [consult],
  );

  const submitFree = useCallback(
    (text: string) => {
      const team = resolveTeam(text);
      setQuery(team.name);
      void consult(team);
    },
    [consult],
  );

  const retry = useCallback(() => {
    if (teamRef.current) void consult(teamRef.current);
  }, [consult]);

  // Entrada escalonada: topbar → headline → orbe → pesquisa → rodapé/dock.
  useEffect(() => {
    if (reducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-animate]',
        { y: 26, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.11,
          delay: 0.1,
          clearProps: 'transform,opacity,visibility',
        },
      );
      gsap.fromTo(
        '.orb-canvas',
        { scale: 0.93, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'power3.out', delay: 0.34 },
      );
    }, rootRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div className="app" ref={rootRef}>
      <div className="fx-blob fx-blob-a" aria-hidden />
      <div className="fx-blob fx-blob-b" aria-hidden />
      <div className="fx-noise" aria-hidden />

      <TopBar />

      <main className="stage">
        <div className="intro" data-animate>
          <p className="eyebrow">
            <span className="rule" aria-hidden />
            Oráculo · Época 2026
            <span className="rule" aria-hidden />
          </p>
          <h1 className="title">A bola de cristal decide.</h1>
        </div>

        <div className="orb-stage">
          <div className="orb-viewport">
            <div className="orb-canvas">
              <CrystalBall phase={phase} quality={tier} reducedMotion={reducedMotion} />
            </div>

            <div className="search-float" data-animate data-covered={panel !== null}>
              <SearchBar
                value={query}
                onChange={setQuery}
                onPick={pickTeam}
                onSubmit={submitFree}
                phase={phase}
                covered={panel !== null}
                reducedMotion={reducedMotion}
                inputRef={inputRef}
              />
            </div>

            {panel && (
              <ResultPanel
                state={panel}
                onReset={reset}
                onRetry={retry}
                reducedMotion={reducedMotion}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="foot" data-animate>
        <p>Demonstração — sem previsões reais.</p>
      </footer>

      <DemoDock />
    </div>
  );
}
