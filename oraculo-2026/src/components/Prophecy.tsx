import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { OracleDecision } from '../oracle/types';
import { paintMist } from '../scene/paintMist';
import './prophecy.css';

const RETURN_MS = 2150;

export default function Prophecy({ decision, onReset, reducedMotion }: {
  decision: OracleDecision | null; onReset: () => void; reducedMotion: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const altar = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnAt = useRef(0);
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (decision) heading.current?.focus({ preventScroll: true });
  }, [decision]);

  useEffect(() => {
    if (!returning) return;
    const timer = window.setTimeout(onReset, reducedMotion ? 0 : RETURN_MS);
    return () => clearTimeout(timer);
  }, [returning, reducedMotion, onReset]);

  useEffect(() => {
    const surface = canvas.current!;
    const cloud = altar.current!;
    const plate = surface.parentElement!.querySelector('.crystal-plate');
    const ctx = surface.getContext('2d');
    if (!ctx || !plate) return;
    const mist = new Image();
    mist.src = `${import.meta.env.BASE_URL}prophecy-mist.webp`;
    const start = performance.now();
    let raf = 0, last = -100;
    const render = (now: number) => {
      if (!reducedMotion) raf = requestAnimationFrame(render);
      if (now - last < 32 || document.hidden || !mist.naturalWidth) return;
      last = now;
      const box = surface.getBoundingClientRect(), orb = plate.getBoundingClientRect();
      const target = cloud.getBoundingClientRect();
      const scale = Math.min(1, 740 / Math.max(1, box.width), 650 / Math.max(1, box.height));
      const w = Math.max(1, Math.round(box.width * scale)), h = Math.max(1, Math.round(box.height * scale));
      if (surface.width !== w || surface.height !== h) { surface.width = w; surface.height = h; }
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.clearRect(0, 0, w / scale, h / scale);
      const age = (now - start) / 1000;
      // Scrub the same spatial path backwards, after the lettering has dissolved.
      const returningMs = returnAt.current ? now - returnAt.current : 0;
      const progress = reducedMotion ? 1 : returnAt.current
        ? 1 - Math.min(1, Math.max(0, (returningMs - 280) / (RETURN_MS - 300)))
        : Math.min(1, Math.max(0, (age - .38) / 2.2));
      paintMist(ctx, mist, orb.left - box.left + .49 * orb.width,
        orb.top - box.top + .35 * orb.height, target.left - box.left + target.width / 2,
        target.top - box.top + target.height / 2, target.width, target.height,
        progress, returnAt.current ? -returningMs / 1000 : age);
    };
    const redraw = () => render(performance.now());
    if (reducedMotion) {
      mist.onload = redraw;
      window.addEventListener('resize', redraw);
    } else raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      mist.onload = null;
      window.removeEventListener('resize', redraw);
    };
  }, [reducedMotion]);

  return <>
    <canvas className="vision-mist" ref={canvas} aria-hidden="true" />
    <section className="vision-script" ref={altar} aria-label="Profecia demonstrativa" data-returning={returning}>
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
        }}><RotateCcw size={14} aria-hidden /> Nova consulta</button>
      </div>}
    </section>
  </>;
}
