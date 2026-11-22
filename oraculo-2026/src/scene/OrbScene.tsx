/**
 * Federação Oráculo 2026 — conteúdo 3D da bola de cristal.
 *
 * Corre dentro do <Canvas>: esfera de vidro com rim fresnel, núcleo de
 * energia fbm, campo de partículas orbitais, pó exterior, relâmpagos em
 * lineSegments, anel dourado e halo radial. Toda a animação por frame
 * usa refs + uniforms pré-alocados — sem setState dentro do useFrame.
 */
import { useEffect, useMemo, useRef } from 'react';
import type { JSX } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OraclePhase, QualityTier } from '../oracle/types';
import {
  CORE_FRAG,
  CORE_VERT,
  FRESNEL_FRAG,
  FRESNEL_VERT,
  PARTICLES_FRAG,
  PARTICLES_VERT,
} from './shaders';
import { fillParticleAttributes, makeGlowTexture, writeBoltPositions } from './sceneUtils';

interface OrbSceneProps {
  phase: OraclePhase;
  quality: QualityTier;
  reducedMotion: boolean;
  /** Posição do ponteiro normalizada (-1..1), actualizada por listener no window. */
  pointer: { current: { x: number; y: number } };
}

const PARTICLE_COUNTS: Record<QualityTier, number> = { low: 350, balanced: 900, high: 1600 };
const DUST_COUNTS: Record<QualityTier, number> = { low: 140, balanced: 320, high: 560 };
const SPHERE_SEGMENTS: Record<QualityTier, number> = { low: 32, balanced: 48, high: 64 };

interface PhaseParams {
  energy: number;
  swirl: number;
  converge: number;
  hue: number;
  gold: number;
  rim: number;
}

const PHASE_PARAMS: Record<OraclePhase, PhaseParams> = {
  idle: { energy: 0.24, swirl: 1.0, converge: 0.0, hue: 0.0, gold: 0, rim: 0.35 },
  consulting: { energy: 0.46, swirl: 2.0, converge: 0.15, hue: 0.75, gold: 0, rim: 0.55 },
  charging: { energy: 1.0, swirl: 3.1, converge: 1.0, hue: 0.45, gold: 0, rim: 1.0 },
  revealed: { energy: 0.55, swirl: 1.25, converge: 0.1, hue: 0.3, gold: 1, rim: 0.7 },
};

const BOLT_COUNT = 7;
const BOLT_POINTS = 14;
const BOLT_FLOATS = (BOLT_POINTS - 1) * 6;

const RIM_VIOLET = new THREE.Color('#9f6bff');
const RIM_BLUE = new THREE.Color('#4d8dff');
const RIM_GOLD = new THREE.Color('#ffd27d');
const HALO_VIOLET = new THREE.Color('#5d2ee0');
const HALO_GOLD = new THREE.Color('#c98a2e');

function makeParticleField(count: number, rMin: number, rMax: number, pointSize: number) {
  const { positions, seeds } = fillParticleAttributes(count, rMin, rMax);
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
      uSize: { value: pointSize },
      uColorA: { value: new THREE.Color('#a678ff') },
      uColorB: { value: new THREE.Color('#4d8dff') },
      uColorC: { value: new THREE.Color('#ffd27d') },
    },
    vertexShader: PARTICLES_VERT,
    fragmentShader: PARTICLES_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { geometry, material };
}

export default function OrbScene({ phase, quality, reducedMotion, pointer }: OrbSceneProps): JSX.Element {
  const seg = SPHERE_SEGMENTS[quality];

  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const rimRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const ringMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // --- recursos memoizados (geometrias, materiais, texturas) ---
  const glowTex = useMemo(() => makeGlowTexture(), []);
  useEffect(() => () => glowTex.dispose(), [glowTex]);

  const field = useMemo(
    () => makeParticleField(PARTICLE_COUNTS[quality], 1.05, 1.85, 7),
    [quality],
  );
  const dust = useMemo(() => makeParticleField(DUST_COUNTS[quality], 1.9, 3.6, 12), [quality]);
  useEffect(
    () => () => {
      field.geometry.dispose();
      field.material.dispose();
    },
    [field],
  );
  useEffect(
    () => () => {
      dust.geometry.dispose();
      dust.material.dispose();
    },
    [dust],
  );

  const rimMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color('#9f6bff') },
          uIntensity: { value: 0.5 },
          uPower: { value: 2.6 },
        },
        vertexShader: FRESNEL_VERT,
        fragmentShader: FRESNEL_FRAG,
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
      rimMat.dispose();
      coreMat.dispose();
    },
    [rimMat, coreMat],
  );

  // --- relâmpagos: um único lineSegments com buffer dinâmico pré-alocado ---
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
        color: '#c4b0ff',
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

  // --- scratch pré-alocado (cores interpoladas por frame, sem allocs) ---
  const scratch = useMemo(() => ({ rim: new THREE.Color(), halo: new THREE.Color() }), []);

  // --- estado de simulação em refs ---
  const energy = useRef(0.24);
  const converge = useRef(0);
  const hue = useRef(0);
  const gold = useRef(0);
  const flash = useRef(0);
  const swirlTime = useRef(0);
  const particleTime = useRef(0);
  const phaseRef = useRef<OraclePhase>(phase);
  const phaseTime = useRef(0);
  const boltTimer = useRef(0);
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const motion = reducedMotion ? 0.06 : 1;
    const p = PHASE_PARAMS[phase];

    // transição de fase
    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      phaseTime.current = 0;
      if (phase === 'revealed') flash.current = reducedMotion ? 0.35 : 1;
    }
    phaseTime.current += dt;

    const k = 1 - Math.exp(-dt * 4);
    const kSlow = 1 - Math.exp(-dt * 2.2);

    // energia: rampa controlada de ~2.5s durante "charging", alvo suave nas restantes
    const energyTarget = phase === 'charging' ? Math.min(1, phaseTime.current / 2.5) : p.energy;
    energy.current += (energyTarget - energy.current) * k;
    const e = energy.current;

    converge.current += (p.converge - converge.current) * k;
    hue.current += (p.hue - hue.current) * k;
    gold.current += (p.gold - gold.current) * kSlow;
    flash.current *= Math.exp(-dt * 2.6);

    swirlTime.current += dt * p.swirl * Math.max(motion, 0.12);
    particleTime.current += dt * (0.55 + p.swirl * 0.4) * Math.max(motion, 0.15);

    const charging = phase === 'charging';
    const g = groupRef.current;
    if (g) {
      // respiração + pulso de carga + pop do flash
      let s = 1 + Math.sin(t * 1.25) * 0.02 * motion;
      if (charging) s += Math.sin(t * 11) * 0.035 * e * motion;
      s += flash.current * 0.07;
      g.scale.setScalar(s);

      // flutuação suave + micro-vibração durante charging
      const floatY = Math.sin(t * 0.8) * 0.025 * motion;
      if (charging && !reducedMotion) {
        g.position.set(
          (Math.random() - 0.5) * 0.04 * e,
          floatY + (Math.random() - 0.5) * 0.04 * e,
          0,
        );
      } else {
        g.position.x += (0 - g.position.x) * k;
        g.position.y += (floatY - g.position.y) * k;
        g.position.z = 0;
      }

      // parallax do ponteiro (desligado com reducedMotion)
      const maxTilt = 0.18;
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
      g.rotation.y = tilt.current.y + Math.sin(t * 0.12) * 0.05 * motion;
    }

    // rotações lentas das malhas interiores
    const core = coreRef.current;
    if (core) core.rotation.y += dt * 0.15 * motion * (0.4 + p.swirl * 0.3);
    const rimMesh = rimRef.current;
    if (rimMesh) rimMesh.rotation.y += dt * 0.05 * motion;

    // uniforms do rim fresnel
    rimMat.uniforms.uIntensity.value = 0.28 + e * 0.85 + p.rim * 0.25 + flash.current * 1.6;
    scratch.rim.copy(RIM_VIOLET).lerp(RIM_BLUE, hue.current * 0.7).lerp(RIM_GOLD, gold.current * 0.45);
    (rimMat.uniforms.uColor.value as THREE.Color).copy(scratch.rim);

    // uniforms do núcleo
    coreMat.uniforms.uTime.value = swirlTime.current;
    coreMat.uniforms.uEnergy.value = e;
    coreMat.uniforms.uHue.value = hue.current;
    coreMat.uniforms.uGold.value = gold.current;
    coreMat.uniforms.uFlash.value = flash.current;

    // uniforms das partículas (campo principal + pó exterior)
    const px = state.gl.getPixelRatio();
    const pe = Math.min(1, e + flash.current * 0.6);
    const fu = field.material.uniforms;
    fu.uTime.value = particleTime.current;
    fu.uConverge.value = converge.current;
    fu.uEnergy.value = pe;
    fu.uGold.value = gold.current;
    fu.uPixelRatio.value = px;
    const du = dust.material.uniforms;
    du.uTime.value = particleTime.current * 0.4;
    du.uConverge.value = converge.current * 0.25;
    du.uEnergy.value = pe * 0.55;
    du.uGold.value = gold.current;
    du.uPixelRatio.value = px;

    // relâmpagos: reconstrução ocasional + flicker, só em "charging"
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

    // halo atrás da bola: brilho, cor e escala reactivos
    const halo = haloRef.current;
    if (halo) {
      const hm = halo.material;
      hm.opacity = Math.min(1, 0.42 + e * 0.42 + flash.current * 0.8);
      scratch.halo.copy(HALO_VIOLET).lerp(HALO_GOLD, gold.current * 0.7);
      hm.color.copy(scratch.halo);
      const hs = 4.1 + Math.sin(t * 0.9) * 0.08 * motion + e * 0.6 + flash.current * 1.3;
      halo.scale.set(hs, hs, 1);
    }

    // anel dourado: précessão subtil, mais presente na revelação
    const ring = ringRef.current;
    if (ring) ring.rotation.y = 0.3 + Math.sin(t * 0.23) * 0.28 * motion;
    const ringMat = ringMatRef.current;
    if (ringMat) {
      ringMat.opacity = 0.1 + gold.current * 0.35 + e * 0.12 + flash.current * 0.3;
    }
  });

  return (
    <group>
      {/* halo radial por trás do orbe (billboard, não roda com o grupo) */}
      <sprite ref={haloRef} position={[0, 0, -1.15]} scale={[4.3, 4.3, 1]} renderOrder={-2}>
        <spriteMaterial
          map={glowTex}
          color={'#5d2ee0'}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <group ref={groupRef}>
        <points
          geometry={dust.geometry}
          material={dust.material}
          frustumCulled={false}
          renderOrder={-1}
        />

        <mesh ref={coreRef} material={coreMat} renderOrder={0}>
          <sphereGeometry args={[0.72, seg, seg]} />
        </mesh>

        <points
          geometry={field.geometry}
          material={field.material}
          frustumCulled={false}
          renderOrder={1}
        />

        <mesh ref={rimRef} material={rimMat} renderOrder={2}>
          <sphereGeometry args={[1, seg, seg]} />
        </mesh>

        <lineSegments
          geometry={boltGeo}
          material={boltMat}
          frustumCulled={false}
          renderOrder={3}
        />

        <mesh ref={ringRef} rotation={[1.15, 0.3, 0]} renderOrder={1}>
          <torusGeometry args={[1.42, 0.007, 8, 160]} />
          <meshBasicMaterial
            ref={ringMatRef}
            color={'#ffd27d'}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}
