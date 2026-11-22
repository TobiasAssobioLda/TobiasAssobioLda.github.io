/**
 * Federação Oráculo 2026 — utilitários da cena da bola de cristal.
 *
 * Helpers puros (sem React): preenchimento de atributos de partículas,
 * gerador de relâmpagos em buffers pré-alocados e textura de halo
 * gerada via canvas 2D.
 */
import * as THREE from 'three';

const TWO_PI = Math.PI * 2;

/**
 * Preenche atributos de um campo de partículas esférico.
 * `position` guarda a posição base (raio entre rMin e rMax);
 * `aSeed` guarda {mistura de cor, velocidade orbital, fase, tamanho}.
 */
export function fillParticleAttributes(
  count: number,
  rMin: number,
  rMax: number,
): { positions: Float32Array; seeds: Float32Array } {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  const span = rMax - rMin;

  for (let i = 0; i < count; i++) {
    // direcção aleatória uniforme na esfera
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * TWO_PI;
    const ring = Math.sqrt(Math.max(0, 1 - z * z));
    const radius = rMin + span * Math.pow(Math.random(), 0.75);

    positions[i * 3] = ring * Math.cos(theta) * radius;
    positions[i * 3 + 1] = z * radius;
    positions[i * 3 + 2] = ring * Math.sin(theta) * radius;

    seeds[i * 4] = Math.random(); // mistura de cor / raio interior
    seeds[i * 4 + 1] = (0.15 + Math.random() * 0.85) * (Math.random() < 0.5 ? -1 : 1); // velocidade
    seeds[i * 4 + 2] = Math.random() * TWO_PI; // fase
    seeds[i * 4 + 3] = 0.5 + Math.random() * 1.2; // tamanho
  }
  return { positions, seeds };
}

/**
 * Escreve um relâmpago em zig-zag como pares de vértices para
 * <lineSegments>. `pointCount` pontos → (pointCount - 1) segmentos →
 * (pointCount - 1) * 6 floats escritos a partir de `offset`.
 * Devolve o offset seguinte. Não aloca nada.
 */
export function writeBoltPositions(
  out: Float32Array,
  offset: number,
  pointCount: number,
): number {
  // duas direcções aleatórias na esfera — o arco liga-as
  const z1 = Math.random() * 2 - 1;
  const a1 = Math.random() * TWO_PI;
  const r1 = Math.sqrt(Math.max(0, 1 - z1 * z1));
  const x1 = r1 * Math.cos(a1);
  const y1 = r1 * Math.sin(a1);

  const z2 = Math.random() * 2 - 1;
  const a2 = Math.random() * TWO_PI;
  const r2 = Math.sqrt(Math.max(0, 1 - z2 * z2));
  const x2 = r2 * Math.cos(a2);
  const y2 = r2 * Math.sin(a2);

  let o = offset;
  let px = 0;
  let py = 0;
  let pz = 0;

  for (let j = 0; j < pointCount; j++) {
    const f = j / (pointCount - 1);

    // direcção base interpolada entre os dois extremos
    let bx = x1 + (x2 - x1) * f;
    let by = y1 + (y2 - y1) * f;
    let bz = z1 + (z2 - z1) * f;
    const bl = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
    bx /= bl;
    by /= bl;
    bz /= bl;

    // dente de serra máximo a meio do arco
    const amp = Math.sin(f * Math.PI) * 0.3;
    bx += (Math.random() - 0.5) * amp;
    by += (Math.random() - 0.5) * amp;
    bz += (Math.random() - 0.5) * amp;

    const radius = 0.35 + f * 0.65; // nasce no núcleo, termina no rim
    const ll = Math.sqrt(bx * bx + by * by + bz * bz) || 1;
    const cx = (bx / ll) * radius;
    const cy = (by / ll) * radius;
    const cz = (bz / ll) * radius;

    if (j > 0) {
      out[o++] = px;
      out[o++] = py;
      out[o++] = pz;
      out[o++] = cx;
      out[o++] = cy;
      out[o++] = cz;
    }
    px = cx;
    py = cy;
    pz = cz;
  }
  return o;
}

/**
 * Halo radial gerado em canvas — textura para o sprite de brilho
 * atrás da bola. Violeta profundo que desvanece para transparente.
 */
export function makeGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(168,116,255,0.9)');
    grad.addColorStop(0.3, 'rgba(110,72,235,0.42)');
    grad.addColorStop(0.65, 'rgba(72,60,180,0.14)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
