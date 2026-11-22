const tau = Math.PI * 2;
const violet = '177,62,255', pearl = '255,224,255';

/** Draw in plate coordinates; the optical centre matches the existing chamber. */
export function paintInvocation(c: CanvasRenderingContext2D, mist: HTMLImageElement,
  birth: number, fill: number, time: number, impact: number) {
  const { width, height } = c.canvas;
  c.clearRect(0, 0, width, height);
  c.save();
  c.translate(width * .49, height * .385);
  c.scale(width / 640, width / 640);
  const light = birth;
  const hit = impact < 0 ? 0 : Math.min(1, impact * 16) * Math.exp(-3.5 * Math.max(0, impact-.13));
  const glow = (x: number, y: number, rx: number, ry: number, color: string, power: number) => {
    c.save();
    c.translate(x,y); c.scale(rx,ry);
    const g = c.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0, `rgba(${color},${power})`);
    g.addColorStop(.38, `rgba(${color},${power * .52})`);
    g.addColorStop(1, `rgba(${color},0)`);
    c.fillStyle = g; c.fillRect(-1,-1,2,2); c.restore();
  };
  glow(0,-2,192,102,'17,4,28',.84 * light);
  c.globalCompositeOperation = 'screen';
  // The two banks first part around the inscription, then curl back into the glass.
  if (mist.complete && mist.naturalWidth) {
    for (let i = 0; i < 12; i++) {
      const a = i * tau / 12 + .16 * Math.sin(time * .8 + i);
      c.save();
      c.translate(Math.cos(a) * (90 + birth * 63), Math.sin(a) * (10 + birth * 64));
      c.rotate(a + time * .18);
      c.globalAlpha = light * (.34 + .08 * Math.sin(i + time));
      c.drawImage(mist,-58,-30,116,60);
      c.restore();
    }
  }
  const span = 152 * birth;
  const tip = -span + 2 * span * fill;
  c.save();
  c.translate(0, 27);
  c.globalAlpha = light;
  glow(tip,0,45,24,violet,.8);
  const track = new Path2D();
  track.roundRect(-span,-7,2*span,14,7);
  c.strokeStyle = '#c47afc'; c.lineWidth = 1.5; c.stroke(track);
  if (hit > 0) {
    glow(0,0,184,31,'242,105,255',.92*hit);
    c.strokeStyle = `rgba(${pearl},${hit})`;
    c.lineWidth = 1.5 + 4*hit; c.stroke(track);
  }
  c.save();
  c.clip(track);
  const band = c.createLinearGradient(0,-7,0,7);
  band.addColorStop(0,'#e981ff'); band.addColorStop(.25,'#9c1edd');
  band.addColorStop(.66,'#6605af'); band.addColorStop(1,'#fbacff');
  c.fillStyle = band; c.fillRect(-span,-7,tip+span,14);
  if (hit > 0) {
    c.fillStyle = `rgba(255,211,255,${.65*hit})`;
    c.fillRect(-span,-7,2*span,14);
  }
  for (let j=0; j<3; j++) {
    c.beginPath();
    for (let x=-span; x<=tip; x+=2) {
      const y = 3.2*Math.sin(x*.065-time*5+j*2) + 2*Math.sin(x*.14+time*3+j);
      if (x === -span) c.moveTo(x,y); else c.lineTo(x,y);
    }
    c.strokeStyle = `rgba(${pearl},${.42-j*.1})`; c.lineWidth = 1; c.stroke();
  }
  c.restore();
  glow(tip,0,22,14,'247,117,255',1);
  glow(tip,0,12,4,pearl,1); glow(tip,0,3,13,pearl,.92);
  // Sparks peel off the moving tip. During recall their trails spiral inwards.
  for (let i=0; i<34; i++) {
    const u = (time * (.46 + i%4 * .07) + i*.618) % 1;
    const a = i*2.4 + u*.65;
    const x = tip + Math.cos(a)*u*(18+i%8*4) - u*13;
    const y = Math.sin(a)*u*(12+i%6*5) - u*u*12;
    c.fillStyle = `rgba(${i%3 ? violet : pearl},${(1-u)**2})`;
    c.beginPath(); c.arc(x,y,.65+(1-u)*.9,0,tau); c.fill();
  }
  c.restore();
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = light * (fill === 1 ? .94 + .06 * Math.cos(time*6) : 1);
  c.textAlign = 'center'; c.font = 'italic 54px Georgia, serif';
  if (hit > 0) {
    c.translate(4.5*hit*Math.sin(impact*48), -2.3*hit*Math.sin(impact*36));
    c.scale(1+.20*hit,1+.20*hit);
    c.strokeStyle = `rgba(${pearl},${hit})`; c.lineWidth = 2.8*hit;
    c.strokeText('100%',0,4);
  }
  c.shadowColor = '#c348ff'; c.shadowBlur = width * (.012 + .014*hit);
  c.fillStyle = '#fff1ff'; c.fillText(`${Math.floor(fill*100)}%`,0,4);
  c.restore();
}
