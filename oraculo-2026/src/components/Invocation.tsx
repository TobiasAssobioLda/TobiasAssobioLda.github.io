import { useLayoutEffect, useRef, type RefObject } from 'react';
import { paintInvocation } from '../scene/paintInvocation';

export type AbsorbFrame = (angle: number) => void;
const BIRTH = 900, FILL = 3450, IMPACT = 700;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => x * x * (3 - 2 * x);

export default function Invocation({ origin, reducedMotion, absorb, onHandoff, onFinish }: {
  absorb: RefObject<AbsorbFrame | null>;
  origin: DOMRect; reducedMotion: boolean; onHandoff: () => void; onFinish: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current!;
    const plate = canvas.parentElement!;
    const ctx = canvas.getContext('2d');
    const mist = new Image();
    mist.src = `${import.meta.env.BASE_URL}prophecy-mist.webp`;
    const mobile = matchMedia('(pointer: coarse)').matches;
    let raf = 0, start = -1, last = performance.now(), stable = 0;
    let x = origin.left, y = origin.top, w = origin.width;
    let lastPercent = -1, fullSince = -1;
    plate.style.transformOrigin = '0 0';
    plate.style.transition = 'none';
    const frame = (now: number) => {
      if (start < 0) {
        // Follow the actual keyboard/viewport reflow, not a guessed keyboard height.
        plate.style.transform = '';
        const target = plate.getBoundingClientRect();
        const dt = Math.max(0, now - last);
        const k = mobile && !reducedMotion ? 1 - Math.exp(-dt / 125) : 1;
        x += (target.left - x) * k;
        y += (target.top - y) * k;
        w += (target.width - w) * k;
        plate.style.transform = `translate(${x-target.left}px,${y-target.top}px) scale(${w/target.width})`;
        const error = Math.max(Math.abs(target.left-x), Math.abs(target.top-y), Math.abs(target.width-w));
        stable = error < .45 && !plate.closest('.keyboard-open') ? stable + dt : 0;
        if (stable >= (mobile ? 100 : 16)) {
          plate.style.transform = '';
          start = now;
        }
      } else {
        const t = (now - start) * (reducedMotion ? 4 : 1);
        const birth = smooth(clamp(t / BIRTH));
        const fill = clamp((t - BIRTH) / FILL);
        const percent = Math.floor(fill * 100);
        if (percent !== lastPercent) {
          canvas.dataset.percent = String(percent);
          lastPercent = percent;
        }
        const width = Math.min(1000, Math.max(1, Math.round(plate.clientWidth * devicePixelRatio)));
        if (canvas.width !== width) {
          canvas.width = width;
          canvas.height = Math.round(width * 1199 / 1312);
        }
        const time = reducedMotion ? 0 : t / 1000;
        if (fill === 1 && fullSince < 0) fullSince = now;
        const impact = fullSince < 0 ? -1 : (now - fullSince) / IMPACT;
        if (ctx) paintInvocation(ctx, mist, birth, fill, time, reducedMotion ? -1 : impact);
        if (impact >= 1) {
          // Yield the canvas to the storm's render loop. Until its first
          // frame the fully lit inscription remains on the glass.
          absorb.current = angle => {
            // Same radial falloff as the storm sheet at the luminous tip.
            const tilt = angle / (1 + 1.65 * .32);
            const pull = clamp(tilt / .83);
            if (pull >= 1) { absorb.current = null; onFinish(); return; }
            canvas.style.transform = `rotate(${tilt}rad) matrix(${1-.24*pull},0,${-.17*pull},${1-.38*pull},0,0)`;
            canvas.style.opacity = String(1 - smooth(pull));
          };
          onHandoff();
          return;
        }
      }
      last = now;
      raf = requestAnimationFrame(frame);
    };
    frame(last);
    return () => {
      cancelAnimationFrame(raf);
      absorb.current = null;
      plate.style.removeProperty('transform');
      plate.style.removeProperty('transform-origin');
      plate.style.removeProperty('transition');
    };
  }, [origin, reducedMotion, absorb, onHandoff, onFinish]);
  return <canvas ref={ref} className="invocation" style={{ opacity: 1, pointerEvents: 'none',
    transformOrigin: '49% 38.5%', willChange: 'transform, opacity' }} />;
}
