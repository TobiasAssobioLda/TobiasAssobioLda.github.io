import { useEffect, useState } from 'react';
import type { QualityTier } from '../oracle/types';

export interface QualityInfo {
  tier: QualityTier;
  reducedMotion: boolean;
  dpr: number;
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: { effectiveType?: string; saveData?: boolean };
}

/** Deteta o nível de qualidade gráfica adequado ao dispositivo. */
function detectTier(): QualityTier {
  if (typeof navigator === 'undefined') return 'balanced';
  const nav = navigator as NavigatorWithMemory;
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const slowNet =
    nav.connection?.saveData || nav.connection?.effectiveType === '2g' || nav.connection?.effectiveType === 'slow-2g';
  if (slowNet || cores <= 2 || memory <= 2) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'balanced';
}

/**
 * Hook partilhado: tier de qualidade + preferência de movimento reduzido.
 * Usado tanto pela cena 3D como pela UI para adaptar efeitos.
 */
export function useQuality(): QualityInfo {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [tier] = useState<QualityTier>(detectTier);
  const [dpr, setDpr] = useState(() =>
    typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2),
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    const onResize = () => setDpr(Math.min(window.devicePixelRatio || 1, 2));
    window.addEventListener('resize', onResize);
    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const effectiveTier: QualityTier = reducedMotion ? 'low' : tier;
  const effectiveDpr = effectiveTier === 'low' ? Math.min(dpr, 1.25) : dpr;
  return { tier: effectiveTier, reducedMotion, dpr: effectiveDpr };
}
