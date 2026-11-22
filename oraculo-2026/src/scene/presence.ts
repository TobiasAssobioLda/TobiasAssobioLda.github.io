import type { OraclePhase } from '../oracle/types';

const ease = (value: number) => {
  const x = Math.max(0, Math.min(1, value));
  return x * x * (3 - 2 * x);
};
const range = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

export class Presence {
  time = 0;
  flow = range(0, 32);
  face = 0;
  eyes = 0;
  blink = 0;
  flash = 0;
  seed = Math.random();
  angle = range(-1, 1);
  private targetAngle = this.angle;
  energy = 0;
  x = 0;
  y = 0;
  private targetX = 0;
  private targetY = 0;
  private noticed = -10;
  private start = range(3, 5);
  private duration = range(6, 9);
  private strength = range(.76, 1);
  private boltAt = range(5, 11);
  private boltPower = 0;
  private boltStart = -10;
  private blinkAt = range(5, 9);
  private blinkStart = -10;
  private blinkLength = .26;
  private lastPhase: OraclePhase = 'idle';
  private phaseAge = 0;
  private recalling = false;
  private eyeStrength = 1;

  attend(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
    if (this.time - this.noticed > 4.5) this.noticed = this.time;
  }

  step(dt: number, phase: OraclePhase, vortex: number) {
    this.time += dt;
    const inheritVisit = this.recalling && phase === 'idle';
    if (this.lastPhase !== phase) {
      if (phase === 'idle' && this.lastPhase === 'revealed') {
        // Resume on the plateau of the current visit, not in the empty
        // interval before the next one. Both envelopes equal one at age .44.
        this.start = inheritVisit ? this.time - .44 * this.duration : this.time + range(4, 9);
        if (inheritVisit) {
          this.strength = this.face;
          this.eyeStrength = this.eyes;
        }
        this.noticed = -10;
        this.recalling = false;
      }
      this.phaseAge = 0;
      this.lastPhase = phase;
      if (phase === 'charging') this.boltAt = this.time + range(.28, 1.1);
    }
    this.phaseAge += dt;
    const t = this.time;
    if (t > this.start + this.duration) {
      this.start = t + range(4, 15);
      this.duration = range(4.4, 9);
      this.strength = range(.31, 1.12);
      this.eyeStrength = 1;
      this.targetAngle = range(-1, 1);
    }
    const age = (t - this.start) / this.duration;
    const visit = ease(age / .39) * ease((1 - age) / .53);
    const curiosity = ease((t - this.noticed) / .48) * ease((this.noticed + 3.4 - t) / 2);
    const charge = phase === 'charging' ? ease(this.phaseAge / 2.3) : 0;
    const reveal = phase === 'revealed' ? ease((3 - this.phaseAge) / 2.5) : 0;
    const wake = phase === 'consulting' ? .66 : 0;
    if (phase === 'revealed' && vortex < 0) this.recalling = true;
    const approach = Math.max(wake, charge, reveal, phase === 'charging' ? .96 : 0);
    const follow = 1 - Math.exp(-dt * 4.5);
    this.angle += (this.targetAngle - this.angle) * (1 - Math.exp(-dt));
    const remaining = Math.abs(vortex);
    const faceTarget = this.recalling ? .69 * ease((.66 - remaining) / .53) : Math.max(visit * this.strength, approach);
    const eyeTarget = this.recalling ? .48 * ease((.49 - remaining) / .43)
      : Math.max(this.eyeStrength * ease((age - .16) / .23) * ease((1 - age) / .37), curiosity * .68, approach);
    // Filter the targets even across the handoff; never assign the rendered pose on reset.
    const settle = this.recalling ? 1 - Math.exp(-dt * 1.65) : follow;
    this.face += (faceTarget - this.face) * settle;
    this.eyes += (eyeTarget - this.eyes) * settle;
    if (t >= this.blinkAt) {
      if (this.eyes > .48) {
        this.blinkStart = t;
        this.blinkLength = range(.21, .34);
      }
      this.blinkAt = t + range(3.6, 10);
    }
    const b = (t - this.blinkStart) / this.blinkLength;
    this.blink = ease(b / .30) * ease((1 - b) / .57);
    if (t >= this.boltAt) {
      this.seed = Math.random();
      this.boltPower = range(.30, .85) + .24 * charge;
      this.boltStart = t;
      this.boltAt = t + range(7, 22);
    }
    this.flash = this.boltPower * Math.exp(-14 * (t - this.boltStart));
    this.energy += ((phase === 'charging' ? 1 : Math.max(wake, reveal * .5)) - this.energy) * follow;
    this.flow += dt * (.81 + 1.9 * this.energy);
    this.x += (this.targetX - this.x) * follow;
    this.y += (this.targetY - this.y) * follow;
  }
}
