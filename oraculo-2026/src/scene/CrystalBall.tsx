/**
 * Federação Oráculo 2026 — bola de cristal (camada 3D).
 *
 * Camada absoluta que preenche o pai: <Canvas> transparente (alpha) com
 * a cena do orbe, ou um fallback CSS quando WebGL não existe. O canvas
 * nunca captura eventos — o parallax lê 'pointermove' no window. Bloom
 * só em quality 'high' sem reducedMotion.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { JSX } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { CrystalBallProps, QualityTier } from '../oracle/types';
import FallbackOrb from './FallbackOrb';
import OrbScene from './OrbScene';

const DPR_CLAMP: Record<QualityTier, number> = { low: 1.25, balanced: 1.75, high: 2 };

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

export default function CrystalBall({ phase, quality, reducedMotion }: CrystalBallProps): JSX.Element {
  const pointer = useRef({ x: 0, y: 0 });
  const supported = useMemo(() => isWebGLSupported(), []);

  // parallax: o canvas tem pointer-events:none, por isso escutamos o window
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
  const postfx = supported && quality === 'high' && !reducedMotion;

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      {supported ? (
        <Canvas
          dpr={dpr}
          camera={{ position: [0, 0, 5.4], fov: 40, near: 0.1, far: 40 }}
          gl={{
            alpha: true,
            antialias: quality === 'high',
            powerPreference: 'high-performance',
            stencil: false,
          }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <OrbScene phase={phase} quality={quality} reducedMotion={reducedMotion} pointer={pointer} />
          {postfx ? (
            <EffectComposer>
              <Bloom mipmapBlur intensity={1.0} luminanceThreshold={0.18} luminanceSmoothing={0.3} />
            </EffectComposer>
          ) : null}
        </Canvas>
      ) : (
        <FallbackOrb phase={phase} reducedMotion={reducedMotion} />
      )}
    </div>
  );
}
