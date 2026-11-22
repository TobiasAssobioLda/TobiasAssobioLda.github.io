import { useEffect, useRef, useState, type RefObject } from 'react';
import { RotateCcw } from 'lucide-react';
import type { OracleDecision } from '../oracle/types';
import { paintMist } from '../scene/paintMist';
import Storm, { type StormFrame } from '../scene/Storm';
import './prophecy.css';

const DISSOLVE_MS = 480, RECALL_MS = 3580;

export default function Prophecy({ decision, onNew, onFinish, reducedMotion, vortex }: {
  vortex: RefObject<number>;
  decision: OracleDecision | null; onNew: (decision: OracleDecision) => void; onFinish: () => void; reducedMotion: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const stormFrame = useRef<StormFrame | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnAt = useRef(0);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (decision) heading.current?.focus({ preventScroll: true });
  }, [decision]);

  useEffect(() => {
    if (returning && reducedMotion) onFinish();
  }, [returning, reducedMotion, onFinish]);

  useEffect(() => {
    const surface = canvas.current!;
    const cloud = layer.current!;
    const viewport = cloud.parentElement!;
    const plate = viewport.querySelector<HTMLElement>('.crystal-plate')!;
    const ctx = surface.getContext('2d');
    let width = 0, height = 0, sx = 0, sy = 0;
    const layout = () => {
      const box = viewport.getBoundingClientRect(), orb = plate.getBoundingClientRect();
      width = Math.min(box.width, Math.max(orb.width, Math.min(320, box.width)));
      height = Math.min(box.height, Math.max(orb.height, 220));
      const left = (box.width - width) / 2;
      const top = Math.max(0, Math.min(box.height - height, orb.top - box.top + (orb.height - height) / 2));
      Object.assign(cloud.style, {left:`${left}px`, top:`${top}px`, width:`${width}px`, height:`${height}px`});
      sx = orb.left - box.left - left + .49 * orb.width;
      sy = orb.top - box.top - top + .385 * orb.height;
    };
    const mist = new Image();
    mist.src = `${import.meta.env.BASE_URL}prophecy-mist.webp`;
    const start = performance.now();
    let raf = 0;
    const interval = matchMedia('(pointer: coarse)').matches ? 1000 / 30 : 1000 / 60;
    let due = 0;
    const render = (now: number) => {
      if (!reducedMotion) raf = requestAnimationFrame(render);
      if (now < due - 1 || document.hidden || !width || !height) return;
      due = (now - due > interval ? now : due) + interval;
      // Leave air above the crown so an escaping wisp isn't cut by the plate bounds.
      const pad = height * .14;
      const scale = Math.min(1, 600 / width, 600 / (height + 2*pad));
      const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round((height+2*pad) * scale));
      if (surface.width !== w || surface.height !== h) { surface.width = w; surface.height = h; }
      ctx?.setTransform(scale, 0, 0, scale, 0, pad*scale);
      ctx?.clearRect(0, -pad, w / scale, h / scale);
      const age = (now - start) / 1000;
      // Scrub the same spatial path backwards, after the lettering has dissolved.
      const returningMs = returnAt.current ? now - returnAt.current : 0;
      const u = Math.min(1, Math.max(0, (returningMs - DISSOLVE_MS) / RECALL_MS));
      const progress = reducedMotion ? 1 : returnAt.current
        ? 1 - u*u*(3-2*u)
        : Math.min(1, Math.max(0, (age - .35) / 4.15));
      vortex.current = reducedMotion ? 0 : returnAt.current ? -progress : progress;
      const veil = Math.min(1, Math.max(0, (progress - .54) / .34));
      plate.style.opacity = String(1 - veil * veil * (3 - 2 * veil));
      stormFrame.current?.(progress);
      if (ctx && mist.complete && mist.naturalWidth) paintMist(ctx, mist, sx, sy,
        width / 2, height * .49, width * .90, height * .91, progress,
        age);
      if (returnAt.current && u === 1) onFinish();
    };
    const resize = () => { layout(); if (reducedMotion) {due = 0; render(performance.now());} };
    const ro = new ResizeObserver(resize);
    ro.observe(plate); ro.observe(viewport); ro.observe(plate.parentElement!);
    resize();
    if (reducedMotion) mist.onload = resize;
    else raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      mist.onload = null;
      ro.disconnect();
      vortex.current = 0;
      plate.style.removeProperty('opacity');
    };
  }, [reducedMotion, vortex, onFinish]);

  return <div className="vision-layer" ref={layer}>
    {!reducedMotion && <Storm frame={stormFrame} />}
    <canvas className="vision-mist" ref={canvas} aria-hidden="true" />
    <section className="vision-script" aria-label="Profecia demonstrativa" data-returning={returning}>
      {decision && <div className="inscription">
        <p className="vision-seal"><i /> Profecia · DEMO <i /></p>
        <h2 ref={heading} tabIndex={-1}>{decision.team.name}</h2>
        <dl className="vision-terms">
          <div><dt>Mercado</dt><dd>{decision.market}</dd></div>
          <div><dt>Seleção</dt><dd>{decision.selection}</dd></div>
          <div><dt>Odd</dt><dd>{decision.odd.toFixed(2)}</dd></div>
        </dl>
        <p className="vision-reason">{decision.factors[0]}</p>
        <button type="button" disabled={returning} onClick={() => {
          returnAt.current = performance.now();
          setReturning(true);
          onNew(decision);
        }}><RotateCcw size={14} aria-hidden /> Nova consulta</button>
      </div>}
    </section>
  </div>;
}
