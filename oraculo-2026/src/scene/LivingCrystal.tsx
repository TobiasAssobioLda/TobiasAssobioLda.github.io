import { useEffect, useRef, useState } from 'react';
import type { CrystalBallProps } from '../oracle/types';
import { drawChamber } from './drawChamber';
import { Presence } from './presence';
import './livingCrystal.css';

const asset = (name: string) => `${import.meta.env.BASE_URL}${name}.webp`;

export default function LivingCrystal({ phase, quality, reducedMotion }: CrystalBallProps) {
  const phaseRef = useRef(phase);
  const ref = useRef<HTMLCanvasElement>(null);
  const poster = useRef<HTMLImageElement>(null);
  const [generation, restore] = useState(0);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useEffect(() => {
    const canvas = ref.current!;
    const base = poster.current!;
    canvas.style.opacity = '0';
    if (reducedMotion) return;
    const coarsePointer = matchMedia('(pointer: coarse)').matches;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: coarsePointer ? 'low-power' : 'high-performance',
    });
    if (!gl) return;
    const state = new Presence();
    let renderer: ReturnType<typeof drawChamber> | undefined;
    let closed = false, visible = true, raf = 0, last = 0, due = 0;
    let sampleTime = 0, frames = 0, scale = 1, measureAt = 0, stableWindows = 0;
    const maxFps = coarsePointer || quality === 'low'
      ? 30
      : matchMedia('(pointer: fine)').matches ? 60 : quality === 'high' ? 60 : 45;
    let fpsTarget = maxFps;
    let bounds: DOMRect | undefined;
    const resize = () => {
      bounds = canvas.getBoundingClientRect();
      const cap = quality === 'low' ? 480 : quality === 'high' ? 1024 : 768;
      const width = Math.max(1, Math.round(scale * Math.min(cap, canvas.clientWidth * Math.min(devicePixelRatio, 1.8))));
      if (width !== canvas.width) {
        canvas.width = width;
        canvas.height = Math.round(width * 1199 / 1312);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    };
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (now < due || !renderer) return;
      const dt = last ? (now - last) / 1000 : 1 / fpsTarget;
      last = now;
      due += 1000 / fpsTarget;
      if (now - due > 80) due = now;
      state.step(Math.min(.16, dt), phaseRef.current);
      renderer.frame(state);
      if (canvas.style.opacity !== '1') {
        canvas.style.opacity = '1';
        base.style.visibility = 'hidden';
      }
      if (!measureAt) measureAt = now + 1200;
      if (now < measureAt) return;
      frames++;
      sampleTime += frames === 1 ? 1 / fpsTarget : dt;
      if (sampleTime >= 2.5) {
        const achieved = frames / sampleTime;
        if (achieved < fpsTarget * .86) {
          stableWindows = 0;
          if (fpsTarget > 30) {
            fpsTarget = Math.max(30, fpsTarget - 15);
            due = now;
          } else if (scale > .55) {
            scale *= .83;
            resize();
          }
        } else if (achieved > fpsTarget * .95 && fpsTarget < maxFps) {
          stableWindows++;
          if (stableWindows >= 3) {
            fpsTarget = Math.min(maxFps, fpsTarget + 15);
            stableWindows = 0;
            due = now;
          }
        } else {
          stableWindows = 0;
        }
        frames = sampleTime = 0;
      }
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      last = due = 0;
      if (!closed && renderer && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const onPointer = (event: PointerEvent) => {
      const box = bounds ?? (bounds = canvas.getBoundingClientRect());
      const x = (event.clientX - box.left) / box.width - .49;
      const y = (event.clientY - box.top) / box.height - .385;
      if (x*x + y*y*.84 < .145) state.attend(x*2.65, y*2.4);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      closed = true;
      cancelAnimationFrame(raf);
      canvas.style.opacity = '0';
      base.style.visibility = 'visible';
    };
    const restored = () => restore(n => n + 1);
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    const ro = new ResizeObserver(resize);
    io.observe(canvas);
    ro.observe(canvas);
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    document.addEventListener('visibilitychange', schedule);
    canvas.addEventListener('pointermove', onPointer, { passive: true });
    canvas.addEventListener('pointerdown', onPointer, { passive: true });
    const face = new Image();
    face.src = asset('apparition');
    const fog = new Image();
    fog.src = asset('vapour');
    Promise.all([base.decode(), face.decode(), fog.decode()]).then(() => {
      if (closed) return;
      renderer = drawChamber(gl, [base, face, fog]);
      resize();
      schedule();
    }).catch(error => { if (!closed) console.warn('Oraculo: modo sem movimento.', error); });
    return () => {
      closed = true;
      cancelAnimationFrame(raf);
      renderer?.dispose();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', schedule);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, [quality, reducedMotion, generation]);

  return (
    <div className="crystal-stage" aria-hidden="true">
      <div className="crystal-plate">
        <img ref={poster} src={asset('chamber')} alt="" />
        <canvas ref={ref} />
      </div>
    </div>
  );
}
