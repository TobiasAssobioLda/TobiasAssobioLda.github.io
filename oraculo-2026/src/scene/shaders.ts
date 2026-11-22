/**
 * Federação Oráculo 2026 — fontes GLSL da cena da bola de cristal.
 *
 * Todos os shaders vivem em template strings inline porque não existe
 * loader de .glsl configurado no Vite. Cada material recebe os seus
 * uniforms via useMemo no componente da cena.
 */

/** Rim fresnel do vidro exterior — vértices. */
export const FRESNEL_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalMatrix * normal;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/** Rim fresnel do vidro exterior — fragmentos (aditivo). */
export const FRESNEL_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPower;

varying vec3 vNormal;
varying vec3 vView;

void main() {
  float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), uPower);
  gl_FragColor = vec4(uColor * fresnel * uIntensity, fresnel);
}
`;

/** Núcleo de energia — vértices. */
export const CORE_VERT = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = position;
  vNormal = normalMatrix * normal;
  vView = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/**
 * Núcleo de energia — fragmentos.
 * Turbulência fbm (value noise) com domain warp, paleta violeta → azul
 * com veios dourados quando uGold sobe (fase "revealed").
 */
export const CORE_FRAG = /* glsl */ `
uniform float uTime;
uniform float uEnergy;
uniform float uHue;
uniform float uGold;
uniform float uFlash;

varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);

  float n000 = hash3(i);
  float n100 = hash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash3(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.07 + vec3(3.1, 1.7, 2.3);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 q = vPos * 2.4;

  // rotação lenta do domínio → swirl
  float rot = uTime * 0.28;
  float cs = cos(rot);
  float sn = sin(rot);
  q = vec3(cs * q.x - sn * q.z, q.y, sn * q.x + cs * q.z);

  float warp = fbm(q * 1.4 + vec3(0.0, -uTime * 0.3, uTime * 0.12));
  float n = fbm(q + vec3(warp * 1.5) + vec3(0.0, -uTime * 0.45, 0.0));

  vec3 violet = vec3(0.49, 0.19, 0.98); // #7d31fb
  vec3 blue   = vec3(0.30, 0.55, 1.00); // #4d8dff
  vec3 gold   = vec3(1.00, 0.82, 0.49); // #ffd27d

  float m = smoothstep(0.2, 0.9, n);
  vec3 col = mix(violet, blue, clamp(m + uHue * 0.55 - 0.15, 0.0, 1.0));

  // veios dourados na revelação
  float veins = smoothstep(0.6, 0.72, n) * uGold;
  col = mix(col, gold, veins);

  // volume: bordas do globo mais ténues que o centro
  float ndv = abs(dot(normalize(vNormal), normalize(vView)));
  float body = 0.3 + 0.7 * pow(ndv, 0.7);

  float glow = (0.25 + n * n * 1.6) * (0.3 + uEnergy * 1.5);
  col = col * glow * body;
  col += violet * pow(n, 3.0) * uEnergy * 0.9;
  col += (violet + blue) * 0.5 * uFlash * (0.4 + n);

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Campo de partículas — vértices.
 * Toda a animação (órbita, convergência, cintilação) acontece no GPU a
 * partir de atributos pré-computados — zero alocações por frame.
 */
export const PARTICLES_VERT = /* glsl */ `
uniform float uTime;
uniform float uConverge;
uniform float uPixelRatio;
uniform float uSize;

attribute vec4 aSeed; // x: mistura de cor, y: velocidade orbital, z: fase, w: tamanho

varying float vFade;
varying float vMix;

void main() {
  vec3 p = position;

  // órbita em torno de Y, velocidade e fase por partícula
  float ang = uTime * aSeed.y + aSeed.z;
  float c = cos(ang);
  float s = sin(ang);
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);

  // oscilação vertical suave
  p.y += sin(uTime * (0.35 + abs(aSeed.y)) + aSeed.z * 5.0) * 0.05 * aSeed.x;

  // convergência para o núcleo durante "charging"
  float inner = 0.16 + aSeed.x * 0.18;
  p *= mix(1.0, inner, uConverge);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  vFade = 0.55 + 0.45 * sin(uTime * (1.4 + abs(aSeed.y) * 2.0) + aSeed.z * 7.0);
  vMix = aSeed.x;

  float ps = uSize * aSeed.w * uPixelRatio * (4.2 / -mv.z);
  gl_PointSize = min(ps, 90.0);
}
`;

/** Campo de partículas — fragmentos (pontos suaves aditivos). */
export const PARTICLES_FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uEnergy;
uniform float uGold;

varying float vFade;
varying float vMix;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.08, d);
  a *= a;

  vec3 col = mix(uColorA, uColorB, vMix);
  col = mix(col, uColorC, uGold * smoothstep(0.75, 1.0, vMix));

  float bright = (0.35 + uEnergy * 1.15) * vFade;
  gl_FragColor = vec4(col * bright, a);
}
`;
