const tau = Math.PI * 2;
const smooth = (n: number) => { const x = Math.max(0, Math.min(1, n)); return x*x*(3-2*x); };

export function paintMist(ctx: CanvasRenderingContext2D, sprite: HTMLImageElement,
  sx: number, sy: number, cx: number, cy: number, width: number, height: number,
  progress: number, time: number) {
  if (progress <= 0) return;
  const bloom = smooth((progress - .66) / .34);
  const settle = smooth((progress - .82) / .18);
  const puff = (x: number, y: number, w: number, h: number, angle: number, alpha: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    ctx.restore();
  };
  if (!bloom) return;
  ctx.save();
  ctx.translate(sx+(cx-sx)*bloom, sy+(cy-sy)*bloom);
  ctx.scale(.72+.28*bloom, .72+.28*bloom);
  for (let i = 0; i < 22; i++) {
    const a = i * tau / 22 - (1-bloom)*2.1;
    const drift = .03*Math.sin(time*.61+i*2.3) + .035*Math.cos(i*3.7);
    puff(Math.cos(a)*( .356+drift)*width, Math.sin(a)*(.336+drift)*height,
      width*(.36+.06*Math.sin(i)), height*(.41+.09*Math.cos(i)), .2*Math.sin(time*.43+i), .88*bloom);
  }
  ctx.save();
  ctx.globalAlpha = settle;
  ctx.scale(width*.56, height*.54);
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  core.addColorStop(0, '#110b20'); core.addColorStop(.57, 'rgba(23,13,37,.97)');
  core.addColorStop(.82, 'rgba(28,14,43,.8)'); core.addColorStop(1, 'rgba(19,8,34,0)');
  ctx.fillStyle = core; ctx.fillRect(-1,-1,2,2);
  ctx.restore();
  const cycle = Math.floor(time / 7.7), spark = time - cycle * 7.7;
  if (spark > 4 && spark < 4.32) {
    const side = cycle % 2 ? 1 : -1;
    ctx.strokeStyle = `rgba(224,173,255,${.8*Math.exp(-10*(spark-4))})`;
    ctx.lineWidth = 1.6; ctx.beginPath();
    for (let i=0; i<9; i++) {
      const x = side * width * (.21+i*.024), y = height*(-.3+i*.018+.033*Math.sin(i*4+cycle));
      if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
