/**
 * Federação Oráculo 2026 — bola de cristal V2 (camada 3D + governador).
 *
 * frameloop="demand": quem manda renderizar é o FrameDriver a uma taxa
 * alvo (60fps ativo, 30fps em repouso). O PerfRig mede o tempo real
 * entre frames renderizados e degrada/recupera níveis (dpr + nº de
 * motes + fps) — adaptação baseada em medição, não em suposições.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { CrystalBallProps, OraclePhase, QualityTier } from '../oracle/types';
import FallbackOrb from './FallbackOrb';
import OrbScene from './OrbScene';

const DPR_CLAMP: Record<QualityTier, number> = { low: 1.25, balanced: 1.75, high: 2 };

/** Degraus de qualidade do governador (pior → mais barato). */
const LEVELS = [
  { fps: 60, dpr: 2.0 },
  { fps: 60, dpr: 1.5 },
  { fps: 60, dpr: 1.2 },
  { fps: 45, dpr: 1.0 },
  { fps: 30, dpr: 0.85 },
] as const;
const MAX_LEVEL = LEVELS.length - 1;
const START_LEVEL: Record<QualityTier, number> = { low: 2, balanced: 1, high: 0 };

/** FPS alvo por fase — repouso é barato quando o dispositivo já provou
 *  não aguentar; máquinas capazes têm sempre 60fps. Espetáculo = KO−8. */
function phaseFps(phase: OraclePhase, reducedMotion: boolean, level: number): number {
  if (reducedMotion) return 24;
  if (phase === 'idle') return level <= 1 ? 60 : 30;
  return 60;
}

/** Suporte WebGL avaliado uma única vez (contexto descartável). */
let webglSupport: boolean | null = null;
function isWebGLSupported(): boolean {
  if (webglSupport !== null) return webglSupport;
  try {
    if (typeof document === 'undefined') {
      webglSupport = false;
      return webglSupport;
    }
    const canvas = document.createElement('canvas');
    webglSupport = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}

interface PerfRigProps {
  phase: OraclePhase;
  quality: QualityTier;
  reducedMotion: boolean;
  pointer: { current: { x: number; y: number } };
}

/**
 * Dentro do Canvas: driver de frames + governador de nível.
 * EMA do intervalo real entre renders decide degradação; a cada ~6s
 * estável faz um probe de recuperação de 2.2s no nível acima.
 */
function PerfRig({ phase, quality, reducedMotion, pointer }: PerfRigProps): JSX.Element {
  const setDpr = useThree((s) => s.setDpr);
  const invalidate = useThree((s) => s.invalidate);
  const [level, setLevel] = useState(() => START_LEVEL[quality]);

  const fpsTarget = Math.min(LEVELS[level].fps, phaseFps(phase, reducedMotion, level));

  const ema = useRef(1000 / 60);
  const frames = useRef(0);
  const lastChange = useRef(performance.now());
  const probe = useRef<{ until: number; previous: number } | null>(null);
  /** backoff de recuperação: duplica a cada probe falhado (cap 60s). */
  const stableWait = useRef(6000);
  const state = useRef({ level, fpsTarget });
  state.current = { level, fpsTarget };

  // ao mudar de qualidade recomeça no nível de partida dessa tier
  useEffect(() => {
    setLevel(START_LEVEL[quality]);
  }, [quality]);

  // aplica dpr do nível (limitado pela tier) e força um render
  useEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, DPR_CLAMP[quality], LEVELS[level].dpr));
    ema.current = 1000 / fpsTarget;
    frames.current = 0;
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, quality]);

  // driver: renderiza à taxa alvo (pausa em separador escondido)
  useEffect(() => {
    invalidate();
    const id = window.setInterval(() => {
      if (!document.hidden) invalidate();
    }, Math.round(1000 / fpsTarget));
    return () => window.clearInterval(id);
  }, [fpsTarget, invalidate]);

  useFrame((_, delta) => {
    const s = state.current;
    const ms = delta * 1000;
    ema.current += (ms - ema.current) * 0.08;
    frames.current += 1;

    // janela de tolerância: 60 frames + 1.2s desde a última mudança
    const now = performance.now();
    if (frames.current < 60 || now - lastChange.current < 1200) return;

    const cap = 1000 / s.fpsTarget;

    // probe em curso: ao fim da janela decide se fica ou reverte
    if (probe.current) {
      if (now >= probe.current.until) {
        const { previous } = probe.current;
        probe.current = null;
        if (ema.current > cap * 1.12) {
          setLevel(previous);
          lastChange.current = now;
          stableWait.current = Math.min(60000, stableWait.current * 2);
        } else {
          stableWait.current = 6000;
        }
      }
      return;
    }

    if (ema.current > cap * 1.18 && s.level < MAX_LEVEL) {
      // não consegue segurar a taxa atual → degrada
      setLevel(s.level + 1);
      lastChange.current = now;
    } else if (s.level > 0 && now - lastChange.current > stableWait.current) {
      // estável → tenta recuperar um nível durante 2.2s
      probe.current = { until: now + 2200, previous: s.level };
      setLevel(s.level - 1);
      lastChange.current = now;
    }
  });

  return (
    <OrbScene
      phase={phase}
      quality={quality}
      reducedMotion={reducedMotion}
      level={level}
      pointer={pointer}
    />
  );
}

export default function CrystalBall({ phase, quality, reducedMotion }: CrystalBallProps): JSX.Element {
  const pointer = useRef({ x: 0, y: 0 });
  const supported = useMemo(() => isWebGLSupported(), []);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  const dpr = Math.min(
    typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1,
    DPR_CLAMP[quality],
  );

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {supported ? (
        <Canvas
          frameloop="demand"
          dpr={dpr}
          camera={{ position: [0, 0.05, 4.25], fov: 38, near: 0.1, far: 40 }}
          gl={{
            alpha: true,
            antialias: false,
            powerPreference: 'high-performance',
            stencil: false,
          }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            // diagnóstico: renderer acessível para medições de perf
            (window as unknown as { __oracle_gl?: unknown }).__oracle_gl = gl;
          }}
        >
          <PerfRig phase={phase} quality={quality} reducedMotion={reducedMotion} pointer={pointer} />
        </Canvas>
      ) : (
        <FallbackOrb phase={phase} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
