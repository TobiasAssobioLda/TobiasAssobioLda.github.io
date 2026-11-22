/**
 * Federação Oráculo 2026 — fontes GLSL da bola de cristal (V2).
 *
 * Direção de arte: esfera de VIDRO translúcido com energia líquida no
 * interior — não um planeta. Todos os shaders são baratos por pixel:
 * ruído reduzido ao essencial, tudo aditivo, sem passes de ecrã inteiro.
 */

/* ------------------------------------------------------------------ */
/* Vidro exterior — fresnel + reflexos especulares tipo softbox        */
/* ------------------------------------------------------------------ */

export const GLASS_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorldPos;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalMatrix * normal;
  vView = -mv.xyz;
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * mv;
}
`;

/**
 * Vidro: rim fresnel violeta + duas softboxes procedurais (riscas de
 * luz alongadas como num estúdio) + brilho de base dourado inferior.
 * Tudo view-space, barato, aditivo.
 */
export const GLASS_FRAG = /* glsl */ `
uniform vec3 uRimColor;
uniform float uIntensity;
uniform float uPower;
uniform float uGold;
uniform float uFlash;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vWorldPos;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);

  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fresnel = pow(1.0 - ndv, uPower);

  // rim principal
  vec3 col = uRimColor * fresnel * uIntensity;

  // aresta de cristal — linha luminosa fina na silhueta
  float edge = pow(1.0 - ndv, 16.0);
  col += vec3(0.82, 0.72, 1.0) * edge * (1.1 + uFlash * 0.8);

  // softbox 1: faixa clara alta à esquerda (luz de estúdio)
  vec3 s1dir = normalize(vec3(-0.62, 0.72, 0.55));
  float s1 = pow(max(dot(reflect(-s1dir, n), v), 0.0), 160.0);
  col += vec3(0.95, 0.9, 1.0) * s1 * 0.85;

  // softbox 2: risca horizontal fina (janela de luz lateral)
  float band = exp(-abs(n.y - 0.18) * 14.0) * pow(fresnel, 0.6);
  col += vec3(0.55, 0.45, 1.0) * band * 0.35;

  // brilho dourado inferior (luz rebotada do pedestal)
  float bounce = exp(-(n.y + 1.0) * 2.6) * pow(1.0 - ndv, 1.4);
  col += vec3(1.0, 0.78, 0.42) * bounce * (0.10 + uGold * 0.30);

  col += uRimColor * uFlash * fresnel * 0.9;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Interior do vidro — profundidade translúcida (backface)             */
/* ------------------------------------------------------------------ */

/**
 * BackSide: gradiente escuro→violeta que dá corpo ao vidro — vê-se a
 * parte de trás da esfera através do vidro. Muito barato.
 */
export const INNER_FRAG = /* glsl */ `
uniform vec3 uDeepColor;
uniform float uGlow;

varying vec3 vNormal;
varying vec3 vView;

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float ndv = abs(dot(n, v));

  // centro translúcido escuro, bordas mais densas/luminosas
  float depth = pow(1.0 - ndv, 1.7);
  vec3 col = uDeepColor * (0.3 + depth * 1.15) * uGlow;

  // haze azulado junto ao vidro — profundidade em vez de vazio
  col += vec3(0.26, 0.3, 0.85) * pow(1.0 - ndv, 5.0) * 0.4 * uGlow;
  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Núcleo — energia líquida (domain warp barato, 4 avaliações)         */
/* ------------------------------------------------------------------ */

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
 * Energia líquida: value noise 3D com domain warp.
 * warp = 2 avaliações, corpo = 2 avaliações → ~metade do custo do fbm
 * de 5 oitavas anterior, com aspecto mais fluido.
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
  return mix(mix(nx00, nx10, f.y), mix(nx01, nx11, f.y), f.z);
}

void main() {
  // coordenadas esféricas com rotação lenta — líquido a rodar
  vec3 p = vPos * 2.6;
  float rot = uTime * 0.35;
  float cs = cos(rot);
  float sn = sin(rot);
  p = vec3(cs * p.x + sn * p.z, p.y, -sn * p.x + cs * p.z);

  // fluxo vertical + warp barato (4 avaliações de ruído no total)
  vec3 flow = vec3(0.0, -uTime * 0.5, 0.0);
  float w = vnoise(p * 1.7 + flow * 0.6) + vnoise(p * 3.4 - flow) * 0.5;
  vec3 q = p + (w - 0.75) * 1.15;
  float n = vnoise(q + flow) * 0.62 + vnoise(q * 2.1 + flow * 1.35) * 0.38;

  vec3 violet = vec3(0.49, 0.19, 0.98);
  vec3 blue   = vec3(0.30, 0.55, 1.00);
  vec3 gold   = vec3(1.00, 0.82, 0.49);

  // rampa de cor: violeta profundo → azul elétrico nas cristas
  float m = smoothstep(0.25, 0.85, n);
  vec3 col = mix(violet * 0.55, mix(violet, blue, 0.85), m);
  col = mix(col, blue, uHue * 0.35);

  // filamentos dourados — cristas finas de ruído (líquido incandescente)
  float fil = pow(1.0 - abs(2.0 * n - 1.0), 7.0);
  col += gold * fil * (0.35 + uGold * 1.4 + uEnergy * 0.55);

  // volume: bordas do globo mais ténues que o centro
  float ndv = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
  float body = 0.45 + 0.55 * pow(ndv, 0.6);

  float glow = (0.35 + n * 1.5) * (0.35 + uEnergy * 1.35);
  col = col * glow * body;
  col += violet * pow(n, 3.0) * uEnergy * 0.7;
  col += mix(violet, gold, uGold) * uFlash * (0.5 + n);

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------------------------------------------ */
/* Motes interiores — partículas DENTRO do vidro                       */
/* ------------------------------------------------------------------ */

/**
 * Partículas contidas na esfera: sobem lentamente como bolhas numa
 * bola de neve, com leve swirl. Durante o "charging" convergem para o
 * núcleo. Tudo no GPU a partir de atributos — zero alocações.
 */
export const MOTES_VERT = /* glsl */ `
uniform float uTime;
uniform float uConverge;
uniform float uPixelRatio;
uniform float uSize;
uniform float uSphereR;

attribute vec4 aSeed; // x: mistura de cor, y: velocidade, z: fase, w: tamanho

varying float vFade;
varying float vMix;

void main() {
  vec3 p = position;

  // subida lenta com wrap dentro da esfera (bolhas de energia)
  float rise = uTime * (0.05 + abs(aSeed.y) * 0.16) + aSeed.z;
  p.y = mod(p.y + rise, uSphereR * 2.0) - uSphereR;

  // swirl azimutal suave
  float ang = uTime * aSeed.y * 0.6 + aSeed.z * 6.2831;
  float c = cos(ang);
  float s = sin(ang);
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);

  // converge para o núcleo durante "charging"
  p *= mix(1.0, 0.22 + aSeed.x * 0.15, uConverge);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  vFade = 0.55 + 0.45 * sin(uTime * (1.2 + abs(aSeed.y) * 2.0) + aSeed.z * 9.0);
  vMix = aSeed.x;

  float ps = uSize * aSeed.w * uPixelRatio * (3.6 / -mv.z);
  gl_PointSize = min(ps, 60.0);
}
`;

export const MOTES_FRAG = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uEnergy;
uniform float uGold;

varying float vFade;
varying float vMix;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  float a = smoothstep(0.5, 0.05, d);
  a *= a;

  vec3 col = mix(uColorA, uColorB, vMix);
  col = mix(col, uColorC, clamp(uGold + vMix * 0.2, 0.0, 1.0) * 0.7);

  float bright = (0.4 + uEnergy * 1.2) * vFade;
  gl_FragColor = vec4(col * bright, a);
}
`;
