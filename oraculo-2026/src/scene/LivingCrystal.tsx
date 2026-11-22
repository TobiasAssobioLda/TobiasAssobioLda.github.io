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
    const gl = canvas.getContext('webgl', {
      alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power',
    });
    if (!gl) return;
    const state = new Presence();
    let renderer: ReturnType<typeof drawChamber> | undefined;
    let closed = false, visible = true, raf = 0, last = 0, due = 0;
    let sampleTime = 0, frames = 0, scale = 1;
    const resize = () => {
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
      if (now + 1 < due || !renderer) return;
      const dt = last ? (now - last) / 1000 : 1 / 30;
      last = now;
      due = Math.max(now, due + 1000 / 30);
      state.step(Math.min(.16, dt), phaseRef.current);
      renderer.frame(state);
      canvas.style.opacity = '1';
      frames++;
      sampleTime += dt;
      if (sampleTime >= 2.5) {
        if (frames / sampleTime < 25 && scale > .55) {
          scale *= .83;
          resize();
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
      const box = canvas.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .49;
      const y = (event.clientY - box.top) / box.height - .385;
      if (x*x + y*y*.84 < .145) state.attend(x*2.65, y*2.4);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      closed = true;
      cancelAnimationFrame(raf);
      canvas.style.opacity = '0';
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
