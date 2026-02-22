'use client';

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';

/* ── Mouse tracking ── */
const mouse = new THREE.Vector2(0, 0);

function useMouseTracker() {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
}

/* ── Shared materials ── */
const bodyMat = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  metalness: 0.88,
  roughness: 0.28,
});

const panelMat = new THREE.MeshStandardMaterial({
  color: '#222222',
  metalness: 0.82,
  roughness: 0.35,
});

const jointMat = new THREE.MeshStandardMaterial({
  color: '#2d2d2d',
  metalness: 0.7,
  roughness: 0.45,
});

const accentMat = new THREE.MeshStandardMaterial({
  color: '#0e0e0e',
  metalness: 0.95,
  roughness: 0.15,
});

const visorMat = new THREE.MeshStandardMaterial({
  color: '#050505',
  metalness: 0.95,
  roughness: 0.1,
  emissive: '#ffaa00',
  emissiveIntensity: 0.15,
});

/* ── Loading spinner ── */
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        width: 48,
        height: 48,
        border: '3px solid #333',
        borderTop: '3px solid #ffaa00',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <div style={{ color: '#666', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        {progress.toFixed(0)}%
      </div>
    </Html>
  );
}

/* ── Glowing Eye ── */
function Eye({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.PointLight>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = Date.now() * 0.003;
    const pulse = 1.0 + Math.sin(t) * 0.4;
    if (glowRef.current) {
      glowRef.current.intensity = 2.0 * pulse;
    }
    if (meshRef.current) {
      const m = meshRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 2.5 * pulse;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffaa00"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={glowRef}
        color="#ffaa00"
        intensity={2.0}
        distance={3}
        decay={2}
      />
    </group>
  );
}

/* ── Head ── */
function Head() {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mouse.x * 0.35, 0.04);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -mouse.y * 0.18, 0.04);
  });

  return (
    <group ref={ref} position={[0, 2.0, 0]}>
      {/* Main head shape */}
      <mesh material={bodyMat}>
        <capsuleGeometry args={[0.38, 0.35, 8, 16]} />
      </mesh>
      {/* Face plate */}
      <mesh position={[0, -0.02, 0.3]} material={panelMat}>
        <boxGeometry args={[0.62, 0.55, 0.15]} />
      </mesh>
      {/* Visor strip */}
      <mesh position={[0, 0.04, 0.39]} material={visorMat}>
        <boxGeometry args={[0.54, 0.16, 0.04]} />
      </mesh>
      {/* Eyes */}
      <Eye position={[-0.14, 0.04, 0.42]} />
      <Eye position={[0.14, 0.04, 0.42]} />
      {/* Chin plate */}
      <mesh position={[0, -0.22, 0.25]} material={accentMat}>
        <boxGeometry args={[0.35, 0.1, 0.1]} />
      </mesh>
      {/* Top sensor */}
      <mesh position={[0, 0.42, 0]} material={jointMat}>
        <cylinderGeometry args={[0.06, 0.08, 0.12, 8]} />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffaa00"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight position={[0, 0.52, 0]} color="#ffaa00" intensity={0.6} distance={2} decay={2} />
    </group>
  );
}

/* ── Torso ── */
function Torso() {
  return (
    <group position={[0, 0.6, 0]}>
      {/* Upper torso */}
      <mesh material={bodyMat}>
        <capsuleGeometry args={[0.55, 0.7, 8, 16]} />
      </mesh>
      {/* Chest plates */}
      <mesh position={[-0.22, 0.15, 0.42]} rotation={[0, 0, 0.1]} material={panelMat}>
        <boxGeometry args={[0.38, 0.55, 0.08]} />
      </mesh>
      <mesh position={[0.22, 0.15, 0.42]} rotation={[0, 0, -0.1]} material={panelMat}>
        <boxGeometry args={[0.38, 0.55, 0.08]} />
      </mesh>
      {/* Center seam */}
      <mesh position={[0, 0.1, 0.46]} material={accentMat}>
        <boxGeometry args={[0.04, 0.7, 0.04]} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 0.68, 0]} material={jointMat}>
        <cylinderGeometry args={[0.14, 0.18, 0.2, 12]} />
      </mesh>
      {/* Lower torso / waist */}
      <mesh position={[0, -0.6, 0]} material={panelMat}>
        <capsuleGeometry args={[0.35, 0.25, 8, 16]} />
      </mesh>
      {/* Waist joint */}
      <mesh position={[0, -0.42, 0]} material={jointMat}>
        <cylinderGeometry args={[0.28, 0.35, 0.15, 12]} />
      </mesh>
      {/* Shoulder joints */}
      <mesh position={[0.65, 0.35, 0]} material={jointMat}>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      <mesh position={[-0.65, 0.35, 0]} material={jointMat}>
        <sphereGeometry args={[0.16, 12, 12]} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, 0.1, -0.42]} material={panelMat}>
        <boxGeometry args={[0.7, 0.8, 0.08]} />
      </mesh>
      {/* Status light on chest */}
      <mesh position={[0, -0.1, 0.48]}>
        <circleGeometry args={[0.03, 12]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#00ccff"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ── Arm ── */
function Arm({ side }: { side: 'left' | 'right' }) {
  const ref = useRef<THREE.Group>(null);
  const x = side === 'right' ? 0.82 : -0.82;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.5 + (side === 'left' ? Math.PI : 0)) * 0.08;
    ref.current.rotation.z = side === 'right' ? -0.04 : 0.04;
  });

  return (
    <group ref={ref} position={[x, 0.55, 0]}>
      {/* Upper arm */}
      <mesh position={[0, -0.28, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.1, 0.35, 8, 12]} />
      </mesh>
      {/* Elbow joint */}
      <mesh position={[0, -0.58, 0]} material={jointMat}>
        <sphereGeometry args={[0.1, 10, 10]} />
      </mesh>
      {/* Forearm */}
      <mesh position={[0, -0.88, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.09, 0.32, 8, 12]} />
      </mesh>
      {/* Wrist */}
      <mesh position={[0, -1.12, 0]} material={jointMat}>
        <cylinderGeometry args={[0.07, 0.08, 0.08, 8]} />
      </mesh>
      {/* Hand */}
      <mesh position={[0, -1.24, 0]} material={panelMat}>
        <boxGeometry args={[0.13, 0.16, 0.08]} />
      </mesh>
      {/* Fingers */}
      <mesh position={[-0.03, -1.38, 0]} material={accentMat}>
        <boxGeometry args={[0.04, 0.12, 0.04]} />
      </mesh>
      <mesh position={[0.03, -1.38, 0]} material={accentMat}>
        <boxGeometry args={[0.04, 0.12, 0.04]} />
      </mesh>
    </group>
  );
}

/* ── Leg ── */
function Leg({ side }: { side: 'left' | 'right' }) {
  const x = side === 'right' ? 0.25 : -0.25;

  return (
    <group position={[x, -0.95, 0]}>
      {/* Hip joint */}
      <mesh material={jointMat}>
        <sphereGeometry args={[0.14, 10, 10]} />
      </mesh>
      {/* Upper leg */}
      <mesh position={[0, -0.38, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.12, 0.42, 8, 12]} />
      </mesh>
      {/* Knee joint */}
      <mesh position={[0, -0.72, 0]} material={jointMat}>
        <sphereGeometry args={[0.11, 10, 10]} />
      </mesh>
      {/* Lower leg */}
      <mesh position={[0, -1.05, 0]} material={bodyMat}>
        <capsuleGeometry args={[0.1, 0.38, 8, 12]} />
      </mesh>
      {/* Ankle */}
      <mesh position={[0, -1.35, 0]} material={jointMat}>
        <cylinderGeometry args={[0.08, 0.09, 0.08, 8]} />
      </mesh>
      {/* Foot */}
      <mesh position={[0, -1.44, 0.04]} material={panelMat}>
        <boxGeometry args={[0.18, 0.08, 0.3]} />
      </mesh>
    </group>
  );
}

/* ── Assembled Robot ── */
function RobotModel() {
  const ref = useRef<THREE.Group>(null);
  useMouseTracker();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mouse.x * 0.12 - 0.15, 0.02);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.2}>
      <group ref={ref} position={[0, -0.2, 0]}>
        <Head />
        <Torso />
        <Arm side="left" />
        <Arm side="right" />
        <Leg side="left" />
        <Leg side="right" />
      </group>
    </Float>
  );
}

/* ── Floating particles ── */
function Particles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#8899aa" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

/* ── Export ── */
export function Robot3D() {
  return (
    <div className="w-full h-[500px] lg:h-[600px]">
      <Canvas
        camera={{ position: [0, 1.2, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.setClearColor('#f4efe6');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <fog attach="fog" args={['#f4efe6', 10, 22]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <pointLight position={[0, 3, 4]} intensity={0.5} color="#ffffff" />
        <Suspense fallback={<Loader />}>
          <Environment preset="city" background={false} />
          <RobotModel />
          <Particles />
          <gridHelper args={[20, 40, '#555555', '#1a1a1a']} position={[0, -2.65, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
