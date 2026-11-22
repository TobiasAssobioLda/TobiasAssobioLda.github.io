import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import CrystalBall from './scene/LivingCrystal';
import { oracle } from './oracle/client';
import { resolveTeam } from './oracle/teams';
import { findMatches, matchState } from './oracle/matches';
import type { DemoMatch } from './oracle/matches';
import type { OracleDecision, OraclePhase, OracleResponse, TeamRef } from './oracle/types';
import { useQuality } from './fx/quality';
import SearchBar from './components/SearchBar';
import ResultPanel from './components/ResultPanel';
import type { PanelState } from './components/ResultPanel';
import DemoDock from './components/DemoDock';
import Prophecy from './components/Prophecy';
import Invocation, { type AbsorbFrame } from './components/Invocation';

/** Duração mínima da fase 'charging' — a revelação merece suspense. */
const CHARGE_MS = 4500;
const SEARCH_RETURN_MS = 4710; // V6.1: 480 ms dissolution + 3580 ms recall + 650 ms rest.
/** Janela da fase 'consulting' — a mesma "leitura dos sinais" do KO−8 V6.3. */
const CONSULT_MS = 1400;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
  const [recall, setRecall] = useState<OracleDecision | null>(null);
  const [waitingForSearch, setWaitingForSearch] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (searchTimer.current !== null) clearTimeout(searchTimer.current); }, []);
  const [visionId, setVisionId] = useState(0);
  const recallDone = useRef<Promise<void> | null>(null);
  const resolveRecall = useRef<(() => void) | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const vortex = useRef(0);
  const absorb = useRef<AbsorbFrame | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);
  const teamRef = useRef<TeamRef | null>(null);
  const chargeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ritual, setRitual] = useState<DOMRect | null>(null);
  const releaseRitual = useRef<(() => void) | null>(null);
  const beginStorm = useCallback(() => {
    releaseRitual.current?.();
    releaseRitual.current = null;
  }, []);
  const finishRitual = useCallback(() => {
    beginStorm();
    setRitual(null);
  }, [beginStorm]);

  const consult = useCallback(async (team: TeamRef, ready?: OracleDecision, origin?: DOMRect) => {
    if (releaseRitual.current) return;
    const presentation = origin && new Promise<void>(resolve => {
      releaseRitual.current = resolve;
      setRitual(origin);
    });
    teamRef.current = team;
    const seq = ++seqRef.current;
    if (chargeTimer.current) {
      clearTimeout(chargeTimer.current);
      chargeTimer.current = null;
    }
    setPanel(null);
    setPhase('consulting');
    try {
      // Disponibilidade ≠ apresentação: com a decisão já calculada não se
      // pede nada ao Oráculo, mas a coreografia é a mesma — 'consulting'
      // respira a janela idêntica à da consulta KO−8 da V6.3.
      const res: OracleResponse = ready
        ? (await sleep(CONSULT_MS), { kind: 'decision', decision: ready })
        : await oracle.consult(team);
      if (seq !== seqRef.current) return;
      if (res.kind === 'decision') {
        if (presentation) await presentation;
        // A second search can finish while the previous smoke is still on screen.
        // Queue only its KO-8 presentation, never the input or the lookup.
        if (recallDone.current) await recallDone.current;
        if (seq !== seqRef.current) return;
        // KO−8: entra imediatamente em 'charging' (o orbe carrega),
        // e só revela a TIP passado o mínimo cinematográfico.
        setVisionId(seq);
        setPhase('charging');
        chargeTimer.current = setTimeout(() => {
          chargeTimer.current = null;
          if (seq !== seqRef.current) return;
          setPanel({ type: 'oracle', response: res });
          setPhase('revealed');
        }, CHARGE_MS);
      } else {
        if (presentation) finishRitual();
        setPanel({ type: 'oracle', response: res });
        setPhase('idle');
      }
    } catch {
      if (seq !== seqRef.current) return;
      if (presentation) finishRitual();
      setPanel({ type: 'error' });
      setPhase('idle');
    }
  }, [finishRitual]);

  const reset = useCallback((focus = true) => {
    seqRef.current++;
    if (chargeTimer.current) {
      clearTimeout(chargeTimer.current);
      chargeTimer.current = null;
    }
    setPhase('idle');
    setPanel(null);
    setQuery('');
    if (focus) requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);
  const newConsultation = useCallback((previous: OracleDecision) => {
    if (!reducedMotion) {
      setWaitingForSearch(true);
      searchTimer.current = setTimeout(() => setWaitingForSearch(false), SEARCH_RETURN_MS);
    }
    setRecall(previous);
    recallDone.current = new Promise(resolve => { resolveRecall.current = resolve; });
    reset(false);
  }, [reset, reducedMotion]);
  const finishReturn = useCallback(() => {
    setRecall(null);
    resolveRecall.current?.();
    resolveRecall.current = recallDone.current = null;
  }, []);

  // Um clique na linha = uma ação. O estado sai dos dados + hora atual:
  //   ready → VOILÀ: a decisão já existe, mas a coreografia é a de sempre
  //   invoke → INVOCO: a decisão é obtida na mesma coreografia
  //   locked → a linha já se abanou no SearchBar; aqui não há nada a fazer.
  const openMatch = useCallback(
    (m: DemoMatch) => {
      const state = matchState(m, Date.now());
      if (state === 'locked') return;
      setQuery(m.label);
      const origin = state === 'invoke'
        ? rootRef.current?.querySelector('.crystal-plate')?.getBoundingClientRect()
        : undefined;
      if (origin) inputRef.current?.blur();
      void consult(m.consultTeam, state === 'ready' ? m.prophecy ?? undefined : undefined, origin);
    },
    [consult],
  );

  const submitFree = useCallback(
    (text: string) => {
      const m = findMatches(text, 1)[0];
      if (m) {
        openMatch(m);
        return;
      }
      // Texto fora do calendário demo → invocação direta (estados do dock).
      const team = resolveTeam(text);
      setQuery(team.name);
      void consult(team);
    },
    [consult, openMatch],
  );

  const retry = useCallback(() => {
    if (teamRef.current) void consult(teamRef.current);
  }, [consult]);

  useEffect(() => {
    const app = rootRef.current;
    if (!app) return;
    const viewport = window.visualViewport;
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    let fullHeight = Math.max(window.innerHeight, viewport?.height ?? 0);
    let raf = 0;
    const update = () => {
      raf = 0;
      const height = viewport?.height ?? window.innerHeight;
      const width = viewport?.width ?? window.innerWidth;
      const top = viewport?.offsetTop ?? 0;
      const left = viewport?.offsetLeft ?? 0;
      const focused = document.activeElement === inputRef.current;
      if (!focused) fullHeight = Math.max(fullHeight, window.innerHeight, height);
      const keyboardOpen = coarsePointer && focused && fullHeight - height > 96;
      app.style.setProperty('--vv-height', `${height}px`);
      app.style.setProperty('--vv-width', `${width}px`);
      app.style.setProperty('--vv-top', `${top}px`);
      app.style.setProperty('--vv-left', `${left}px`);
      app.classList.toggle('keyboard-open', keyboardOpen);
      document.body.classList.toggle('keyboard-open', keyboardOpen);
      if (keyboardOpen) {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    update();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      app.classList.remove('keyboard-open');
      document.body.classList.remove('keyboard-open');
    };
  }, []);

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

  const decision = panel?.type === 'oracle' && panel.response.kind === 'decision' ? panel.response.decision : null;
  const vision = phase === 'charging' || decision !== null;
  // Prepare the storm context behind the search, never on the dissolve frame.
  // Keep its key across the click so charging starts the approved clock in place.
  const candidate = phase === 'idle' && query.trim().length >= 2 && findMatches(query, 1)[0];
  const prewarm = !reducedMotion && !vision && !recall && !panel &&
    (!!ritual || (candidate && matchState(candidate, Date.now()) === 'invoke'));
  return (
    <div className="app" ref={rootRef} data-vision={vision || waitingForSearch || !!ritual || undefined}>
      <div className="fx-blob fx-blob-a" aria-hidden />
      <div className="fx-blob fx-blob-b" aria-hidden />
      <div className="fx-noise" aria-hidden />

      <main className="stage">
        <div className="orb-stage">
          <div className="orb-viewport">
            <div className="orb-canvas">
              <CrystalBall phase={recall ? 'revealed' : phase} quality={tier} reducedMotion={reducedMotion} vortex={vortex}>
                {ritual && <Invocation origin={ritual} reducedMotion={reducedMotion} absorb={absorb} onHandoff={beginStorm} onFinish={finishRitual} />}
              </CrystalBall>
            </div>

            <div className="search-float" data-animate data-covered={!!ritual || waitingForSearch || panel !== null || phase === 'charging'}>
              <SearchBar
                value={query}
                onChange={setQuery}
                onPick={openMatch}
                onSubmit={submitFree}
                phase={phase}
                covered={panel !== null || waitingForSearch}
                reducedMotion={reducedMotion}
                inputRef={inputRef}
              />
            </div>

            {(vision || recall || prewarm) && (
              <Prophecy key={prewarm ? seqRef.current + (ritual ? 0 : 1) : visionId} dormant={!!prewarm} vortex={vortex} absorb={absorb} decision={recall ?? decision} onNew={newConsultation} onFinish={finishReturn} reducedMotion={reducedMotion} />
            )}
            {panel && !decision && (
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

      {new URLSearchParams(location.search).has('dock') && <DemoDock />}
    </div>
  );
}
