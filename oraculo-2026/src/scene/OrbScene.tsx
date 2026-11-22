/**
 * Federação Oráculo 2026 — bola de cristal V2 (conteúdo 3D).
 *
 * Direção de arte: esfera de vidro translúcido com energia líquida
 * no interior. Sem anéis planetários: backface de profundidade,
 * núcleo líquido domain-warp, motes contidos, vidro com speculars
 * tipo softbox, pedestal luminoso, relâmpagos e anel de choque
 * reservados ao KO−8 / revelação.
 *
 * Perf: ~8 draw calls, shaders de custo fixo baixo, zero alocações
 * por frame. `level` (0..4) vem do governador e controla o nº de
 * motes via drawRange.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { JSX } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { OraclePhase, QualityTier } from '../oracle/types';
import {
  CORE_FRAG,
  CORE_VERT,
  GLASS_FRAG,
  GLASS_VERT,
  INNER_FRAG,
  MOTES_FRAG,
  MOTES_VERT,
} from './shaders';
import { fillParticleAttributes, makeGlowTexture, writeBoltPositions } from './sceneUtils';

export interface OrbSceneProps {
  phase: OraclePhase;
  quality: QualityTier;
  reducedMotion: boolean;
  /** 0 = qualidade máxima, 4 = modo de sobrevivência. */
  level: number;
  /** Posição do ponteiro normalizada (-1..1). */
  pointer: { current: { x: number; y: number } };
}

const SPHERE_SEGMENTS: Record<QualityTier, number> = { low: 40, balanced: 56, high: 72 };
const MAX_MOTES = 420;
const MOTES_BY_LEVEL = [420, 320, 220, 150, 90];

interface PhaseParams {
  energy: number;
  swirl: number;
  converge: number;
  hue: number;
  gold: number;
  rim: number;
}

const PHASE_PARAMS: Record<OraclePhase, PhaseParams> = {
  idle: { energy: 0.26, swirl: 1.0, converge: 0.0, hue: 0.0, gold: 0.12, rim: 0.4 },
  consulting: { energy: 0.5, swirl: 1.9, converge: 0.15, hue: 0.7, gold: 0.1, rim: 0.6 },
  charging: { energy: 1.0, swirl: 3.0, converge: 1.0, hue: 0.4, gold: 0.25, rim: 1.0 },
  revealed: { energy: 0.58, swirl: 1.2, converge: 0.1, hue: 0.25, gold: 1.0, rim: 0.75 },
};

const BOLT_COUNT = 7;
const BOLT_POINTS = 14;
const BOLT_FLOATS = (BOLT_POINTS - 1) * 6;

const RIM_VIOLET = new THREE.Color('#a678ff');
const RIM_BLUE = new THREE.Color('#4d8dff');
const RIM_GOLD = new THREE.Color('#ffd27d');
const HALO_VIOLET = new THREE.Color('#5d2ee0');
const HALO_GOLD = new THREE.Color('#c98a2e');
const DEEP = new THREE.Color('#34147a');

export default function OrbScene({
  phase,
  quality,
  reducedMotion,
  level,
  pointer,
}: OrbSceneProps): JSX.Element {
  const seg = SPHERE_SEGMENTS[quality];

  // presença adaptada ao palco: desktop ~86% da altura, mobile mantém
  // o bleed lateral imersivo (dia > largura do viewport)
  const viewport = useThree((s) => s.viewport);
  const viewScale = Math.min(
    1.45,
    Math.max(1.05, Math.min(viewport.height * 0.86, viewport.width * 1.42) / 2),
  );

  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glassRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const soulRef = useRef<THREE.Sprite>(null);
  const pedestalRef = useRef<THREE.Mesh>(null);
  const pedestalMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const shockMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // --- texturas canvas (halo, luz de alma, pedestal) ---
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const soulTex = useMemo(() => makeGlowTexture(), []);
  useEffect(
    () => () => {
      glowTex.dispose();
      soulTex.dispose();
    },
    [glowTex, soulTex],
  );

  // --- motes interiores (dentro do vidro) ---
  const motes = useMemo(() => {
    const { positions, seeds } = fillParticleAttributes(MAX_MOTES, 0.16, 0.88);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uConverge: { value: 0 },
        uEnergy: { value: 0.3 },
        uGold: { value: 0 },
        uPixelRatio: { value: 1 },
        uSize: { value: 9 },
        uSphereR: { value: 0.88 },
        uColorA: { value: new THREE.Color('#b78cff') },
        uColorB: { value: new THREE.Color('#5f9dff') },
        uColorC: { value: new THREE.Color('#ffd27d') },
      },
      vertexShader: MOTES_VERT,
      fragmentShader: MOTES_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, []);
  useEffect(() => () => {
    motes.geometry.dispose();
    motes.material.dispose();
  }, [motes]);

  // o governador controla quantos motes se desenham (drawRange — sem rebuild)
  useEffect(() => {
    const count = MOTES_BY_LEVEL[Math.min(level, MOTES_BY_LEVEL.length - 1)];
    motes.geometry.setDrawRange(0, count);
  }, [level, motes]);

  // --- vidro: backface profunda + shell fresnel/specular ---
  const innerMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uDeepColor: { value: DEEP.clone() },
          uGlow: { value: 0.5 },
        },
        vertexShader: GLASS_VERT,
        fragmentShader: INNER_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    [],
  );
  const glassMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uRimColor: { value: RIM_VIOLET.clone() },
          uIntensity: { value: 0.6 },
          uPower: { value: 2.7 },
          uGold: { value: 0 },
          uFlash: { value: 0 },
        },
        vertexShader: GLASS_VERT,
        fragmentShader: GLASS_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uEnergy: { value: 0.25 },
          uHue: { value: 0 },
          uGold: { value: 0 },
          uFlash: { value: 0 },
        },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useEffect(
    () => () => {
      innerMat.dispose();
      glassMat.dispose();
      coreMat.dispose();
    },
    [innerMat, glassMat, coreMat],
  );

  // --- relâmpagos (só charging) ---
  const boltArr = useMemo(() => new Float32Array(BOLT_COUNT * BOLT_FLOATS), []);
  const boltGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(boltArr, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', attr);
    return g;
  }, [boltArr]);
  const boltMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#d6c4ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(
    () => () => {
      boltGeo.dispose();
      boltMat.dispose();
    },
    [boltGeo, boltMat],
  );

  // scratch + estado de simulação em refs (zero alocações por frame)
  const scratch = useMemo(() => ({ rim: new THREE.Color(), halo: new THREE.Color() }), []);
  const energy = useRef(0.26);
  const converge = useRef(0);
  const hue = useRef(0);
  const gold = useRef(0);
  const flash = useRef(0);
  const shock = useRef(1); // 1 = anel de choque terminado
  const swirlTime = useRef(0);
  const moteTime = useRef(0);
  const phaseRef = useRef<OraclePhase>(phase);
  const phaseTime = useRef(0);
  const boltTimer = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const motion = reducedMotion ? 0.06 : 1;
    const p = PHASE_PARAMS[phase];

    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      phaseTime.current = 0;
      if (phase === 'revealed') {
        flash.current = reducedMotion ? 0.35 : 1;
        shock.current = reducedMotion ? 1 : 0;
      }
    }
    phaseTime.current += dt;

    const k = 1 - Math.exp(-dt * 4);
    const kSlow = 1 - Math.exp(-dt * 2.2);

    const energyTarget = phase === 'charging' ? Math.min(1, phaseTime.current / 2.4) : p.energy;
    energy.current += (energyTarget - energy.current) * k;
    const e = energy.current;

    converge.current += (p.converge - converge.current) * k;
    hue.current += (p.hue - hue.current) * k;
    gold.current += (p.gold - gold.current) * kSlow;
    flash.current *= Math.exp(-dt * 2.8);
    shock.current = Math.min(1, shock.current + dt * 1.35);

    swirlTime.current += dt * p.swirl * Math.max(motion, 0.12);
    moteTime.current += dt * (0.5 + p.swirl * 0.4) * Math.max(motion, 0.15);

    const charging = phase === 'charging';
    const g = groupRef.current;
    if (g) {
      let s = 1 + Math.sin(t * 1.15) * 0.018 * motion;
      if (charging) s += Math.sin(t * 11) * 0.03 * e * motion;
      s += flash.current * 0.08;
      g.scale.setScalar(s);

      const floatY = Math.sin(t * 0.7) * 0.03 * motion;
      if (charging && !reducedMotion) {
        g.position.set(
          (Math.random() - 0.5) * 0.035 * e,
          floatY + (Math.random() - 0.5) * 0.035 * e,
          0,
        );
      } else {
        g.position.x += (0 - g.position.x) * k;
        g.position.y += (floatY - g.position.y) * k;
        g.position.z = 0;
      }

      const maxTilt = 0.16;
      const targetX = reducedMotion
        ? 0
        : THREE.MathUtils.clamp(-pointer.current.y * maxTilt, -maxTilt, maxTilt);
      const targetY = reducedMotion
        ? 0
        : THREE.MathUtils.clamp(pointer.current.x * maxTilt, -maxTilt, maxTilt);
      const pk = 1 - Math.exp(-dt * 3.5);
      tilt.current.x += (targetX - tilt.current.x) * pk;
      tilt.current.y += (targetY - tilt.current.y) * pk;
      g.rotation.x = tilt.current.x;
      g.rotation.y = tilt.current.y + Math.sin(t * 0.1) * 0.04 * motion;
    }

    const core = coreRef.current;
    if (core) core.rotation.y += dt * 0.12 * motion * (0.4 + p.swirl * 0.3);
    const glass = glassRef.current;
    if (glass) glass.rotation.y += dt * 0.04 * motion;

    // vidro
    glassMat.uniforms.uIntensity.value = 0.5 + e * 0.7 + p.rim * 0.2 + flash.current * 1.4;
    glassMat.uniforms.uGold.value = gold.current;
    glassMat.uniforms.uFlash.value = flash.current;
    scratch.rim.copy(RIM_VIOLET).lerp(RIM_BLUE, hue.current * 0.6).lerp(RIM_GOLD, gold.current * 0.4);
    (glassMat.uniforms.uRimColor.value as THREE.Color).copy(scratch.rim);
    innerMat.uniforms.uGlow.value = 0.55 + e * 0.6 + flash.current * 0.7;

    // núcleo
    coreMat.uniforms.uTime.value = swirlTime.current;
    coreMat.uniforms.uEnergy.value = e;
    coreMat.uniforms.uHue.value = hue.current;
    coreMat.uniforms.uGold.value = gold.current;
    coreMat.uniforms.uFlash.value = flash.current;

    // motes
    const mu = motes.material.uniforms;
    mu.uTime.value = moteTime.current;
    mu.uConverge.value = converge.current;
    mu.uEnergy.value = Math.min(1, e + flash.current * 0.6);
    mu.uGold.value = gold.current;
    mu.uPixelRatio.value = state.gl.getPixelRatio();

    // relâmpagos só em charging
    if (charging && !reducedMotion) {
      boltTimer.current += dt;
      if (boltTimer.current > 0.1) {
        boltTimer.current = 0;
        let off = 0;
        for (let b = 0; b < BOLT_COUNT; b++) {
          if (Math.random() < 0.72) {
            off = writeBoltPositions(boltArr, off, BOLT_POINTS);
          } else {
            for (let i = 0; i < BOLT_FLOATS; i++) boltArr[off + i] = 0;
            off += BOLT_FLOATS;
          }
        }
        boltGeo.getAttribute('position').needsUpdate = true;
      }
      boltMat.opacity = (0.3 + Math.random() * 0.6) * Math.min(1, e * 1.4);
    } else {
      boltTimer.current = 0;
      boltMat.opacity *= Math.exp(-dt * 9);
    }

    // halo atrás do orbe
    const halo = haloRef.current;
    if (halo) {
      const hm = halo.material;
      hm.opacity = Math.min(1, 0.4 + e * 0.4 + flash.current * 0.8);
      scratch.halo.copy(HALO_VIOLET).lerp(HALO_GOLD, gold.current * 0.65);
      hm.color.copy(scratch.halo);
      const hs = 4.4 + Math.sin(t * 0.8) * 0.08 * motion + e * 0.6 + flash.current * 1.3;
      halo.scale.set(hs, hs, 1);
    }

    // luz de alma — foco incandescente no núcleo
    const soul = soulRef.current;
    if (soul) {
      const sm = soul.material;
      sm.opacity = Math.min(1, 0.5 + e * 0.5 + flash.current * 0.9);
      scratch.halo.copy(RIM_VIOLET).lerp(RIM_GOLD, gold.current * 0.5);
      sm.color.copy(scratch.halo);
      const ss = 0.85 + Math.sin(t * 1.9) * 0.07 * motion + e * 0.35 + flash.current * 0.5;
      soul.scale.set(ss, ss, 1);
    }

    // pedestal luminoso (peso de estúdio)
    const pm = pedestalMatRef.current;
    if (pm) {
      pm.opacity = 0.3 + e * 0.25 + flash.current * 0.4;
      scratch.halo.copy(HALO_VIOLET).lerp(HALO_GOLD, gold.current * 0.55);
      pm.color.copy(scratch.halo);
    }

    // anel de choque na revelação (expansão + fade em ~0.75s)
    const shockMesh = shockRef.current;
    const shockMat = shockMatRef.current;
    if (shockMesh && shockMat) {
      const sh = shock.current;
      shockMesh.visible = sh < 1;
      if (sh < 1) {
        const ease = 1 - Math.pow(1 - sh, 3);
        shockMesh.scale.setScalar(0.55 + ease * 2.6);
        shockMat.opacity = (1 - sh) * 0.85;
      }
    }
  });

  return (
    <group scale={viewScale}>
      {/* halo radial atrás do orbe */}
      <sprite ref={haloRef} position={[0, 0, -1.3]} scale={[4.4, 4.4, 1]} renderOrder={-3}>
        <spriteMaterial
          map={glowTex}
          color={'#5d2ee0'}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* pedestal luminoso sob o orbe */}
      <mesh
        ref={pedestalRef}
        position={[0, -1.42, -0.2]}
        rotation={[-Math.PI / 2.35, 0, 0]}
        scale={[3.6, 1.6, 1]}
        renderOrder={-2}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={pedestalMatRef}
          map={glowTex}
          color={'#5d2ee0'}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={groupRef}>
        {/* interior do vidro (backface → profundidade translúcida) */}
        <mesh material={innerMat} renderOrder={-1}>
          <sphereGeometry args={[1.0, seg, seg]} />
        </mesh>

        {/* núcleo de energia líquida */}
        <mesh ref={coreRef} material={coreMat} renderOrder={0}>
          <sphereGeometry args={[0.9, seg, seg]} />
        </mesh>

        {/* luz de alma no centro */}
        <sprite ref={soulRef} renderOrder={1}>
          <spriteMaterial
            map={soulTex}
            color={'#a678ff'}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>

        {/* motes de energia dentro do vidro */}
        <points
          geometry={motes.geometry}
          material={motes.material}
          frustumCulled={false}
          renderOrder={2}
        />

        {/* shell de vidro: fresnel + speculars softbox */}
        <mesh ref={glassRef} material={glassMat} renderOrder={3}>
          <sphereGeometry args={[1.0, seg, seg]} />
        </mesh>

        {/* relâmpagos (KO−8) */}
        <lineSegments
          geometry={boltGeo}
          material={boltMat}
          frustumCulled={false}
          renderOrder={4}
        />

        {/* anel de choque na revelação */}
        <mesh ref={shockRef} visible={false} renderOrder={5}>
          <torusGeometry args={[1.05, 0.014, 8, 128]} />
          <meshBasicMaterial
            ref={shockMatRef}
            color={'#ffdca8'}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
