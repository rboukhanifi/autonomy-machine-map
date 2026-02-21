'use client';

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
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

/* ── Wireframe box with visible edges ── */
function WireBox({ size, pos = [0, 0, 0] as [number, number, number], fillColor = '#1a1a1a', edgeColor = '#555', fillOpacity = 0.1 }: {
  size: [number, number, number];
  pos?: [number, number, number];
  fillColor?: string;
  edgeColor?: string;
  fillOpacity?: number;
}) {
  return (
    <group position={pos}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={fillColor} transparent opacity={fillOpacity} depthWrite={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}

/* ── Wireframe sphere ── */
function WireSphere({ r = 0.15, seg = 8, pos = [0, 0, 0] as [number, number, number], edgeColor = '#555' }: {
  r?: number;
  seg?: number;
  pos?: [number, number, number];
  edgeColor?: string;
}) {
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[r, seg, seg]} />
        <meshStandardMaterial color="#222" transparent opacity={0.05} depthWrite={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.SphereGeometry(r, seg, seg)]} />
        <lineBasicMaterial color={edgeColor} />
      </lineSegments>
    </group>
  );
}

/* ── Eye that follows cursor ── */
function Eye({ position }: { position: [number, number, number] }) {
  const pupilRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (pupilRef.current) {
      pupilRef.current.position.x = THREE.MathUtils.lerp(pupilRef.current.position.x, mouse.x * 0.055, 0.1);
      pupilRef.current.position.y = THREE.MathUtils.lerp(pupilRef.current.position.y, mouse.y * 0.04, 0.1);
    }
    if (glowRef.current) {
      glowRef.current.intensity = 1.2 + Math.sin(Date.now() * 0.004) * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Socket */}
      <mesh>
        <boxGeometry args={[0.24, 0.2, 0.07]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.24, 0.2, 0.07)]} />
        <lineBasicMaterial color="#444" />
      </lineSegments>
      {/* Yellow glow */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.19, 0.15]} />
        <meshBasicMaterial color="#ffdd44" toneMapped={false} />
      </mesh>
      {/* Pupil */}
      <mesh ref={pupilRef} position={[0, 0, 0.04]}>
        <circleGeometry args={[0.032, 12]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      {/* Glow light */}
      <pointLight ref={glowRef} position={[0, 0, 0.3]} color="#ffcc00" intensity={1.2} distance={4} decay={2} />
    </group>
  );
}

/* ── Head ── */
function Head() {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mouse.x * 0.3, 0.04);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -mouse.y * 0.15, 0.04);
  });

  return (
    <group ref={ref} position={[0, 2.05, 0]}>
      <WireBox size={[1.3, 1.0, 1.05]} edgeColor="#666" />
      {/* Visor */}
      <WireBox size={[1.1, 0.34, 0.12]} pos={[0, 0.05, 0.48]} fillColor="#050505" edgeColor="#555" fillOpacity={0.6} />
      {/* Eyes */}
      <Eye position={[-0.25, 0.06, 0.53]} />
      <Eye position={[0.25, 0.06, 0.53]} />
      {/* Antenna */}
      <WireBox size={[0.06, 0.35, 0.06]} pos={[0, 0.65, 0]} edgeColor="#555" fillOpacity={0.08} />
      {/* Antenna tip */}
      <mesh position={[0, 0.88, 0]}>
        <octahedronGeometry args={[0.08, 0]} />
        <meshBasicMaterial color="#ffcc00" toneMapped={false} />
      </mesh>
      <lineSegments position={[0, 0.88, 0]}>
        <edgesGeometry args={[new THREE.OctahedronGeometry(0.08, 0)]} />
        <lineBasicMaterial color="#bb9900" />
      </lineSegments>
      <pointLight position={[0, 0.88, 0]} color="#ffcc00" intensity={0.8} distance={2.5} decay={2} />
    </group>
  );
}

/* ── Body ── */
function Body() {
  const screenRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (screenRef.current) {
      const m = screenRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={[0, 0.5, 0]}>
      {/* Torso */}
      <WireBox size={[1.7, 1.7, 1.15]} edgeColor="#555" />

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 0.15, 0.585]}>
        <boxGeometry args={[1.15, 0.9, 0.02]} />
        <meshStandardMaterial color="#080808" emissive="#111100" emissiveIntensity={0.2} />
      </mesh>
      <lineSegments position={[0, 0.15, 0.585]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.15, 0.9, 0.02)]} />
        <lineBasicMaterial color="#ffcc00" />
      </lineSegments>

      {/* Screen content - horizontal lines */}
      {[0.42, 0.34, 0.26, 0.18, 0.1, 0.02, -0.06, -0.14, -0.22].map((y, i) => (
        <mesh key={i} position={[0, y, 0.6]}>
          <planeGeometry args={[0.9 - i * 0.04, 0.008]} />
          <meshBasicMaterial
            color="#ffcc00"
            transparent
            opacity={0.6 - i * 0.06}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Shoulder joints */}
      <WireSphere r={0.2} seg={8} pos={[0.95, 0.6, 0]} edgeColor="#555" />
      <WireSphere r={0.2} seg={8} pos={[-0.95, 0.6, 0]} edgeColor="#555" />
    </group>
  );
}

/* ── Arm ── */
function Arm({ side }: { side: 'left' | 'right' }) {
  const ref = useRef<THREE.Group>(null);
  const x = side === 'right' ? 1.15 : -1.15;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.5 + (side === 'left' ? Math.PI : 0)) * 0.1;
    ref.current.rotation.z = side === 'right' ? -0.06 : 0.06;
  });

  return (
    <group ref={ref} position={[x, 0.35, 0]}>
      <WireBox size={[0.28, 0.65, 0.28]} pos={[0, -0.3, 0]} edgeColor="#555" />
      <WireSphere r={0.14} seg={6} pos={[0, -0.7, 0]} edgeColor="#666" />
      <WireBox size={[0.24, 0.55, 0.24]} pos={[0, -1.05, 0]} edgeColor="#555" />
      {/* Claw */}
      <WireBox size={[0.08, 0.22, 0.1]} pos={[-0.08, -1.52, 0]} edgeColor="#555" />
      <WireBox size={[0.08, 0.22, 0.1]} pos={[0.08, -1.52, 0]} edgeColor="#555" />
    </group>
  );
}

/* ── Legs ── */
function Legs() {
  return (
    <group position={[0, -0.95, 0]}>
      <WireBox size={[1.2, 0.3, 0.85]} edgeColor="#444" />
      {([-0.35, 0.35] as const).map(x => (
        <group key={x} position={[x, -0.5, 0]}>
          <WireBox size={[0.32, 0.65, 0.32]} edgeColor="#555" />
          <WireSphere r={0.14} seg={6} pos={[0, -0.4, 0]} edgeColor="#555" />
          <WireBox size={[0.3, 0.55, 0.3]} pos={[0, -0.75, 0]} edgeColor="#555" />
          <WireBox size={[0.38, 0.12, 0.5]} pos={[0, -1.1, 0.06]} fillColor="#222" edgeColor="#555" />
        </group>
      ))}
    </group>
  );
}

/* ── Assembled robot ── */
function RobotModel() {
  const ref = useRef<THREE.Group>(null);
  useMouseTracker();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, mouse.x * 0.12 - 0.15, 0.02);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.2}>
      <group ref={ref} position={[0, -0.3, 0]}>
        <Head />
        <Body />
        <Arm side="left" />
        <Arm side="right" />
        <Legs />
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
      <pointsMaterial size={0.04} color="#997700" transparent opacity={0.3} sizeAttenuation />
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
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <fog attach="fog" args={['#f4efe6', 10, 22]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, 3, -3]} intensity={0.3} />
        <pointLight position={[0, 3, 4]} intensity={0.6} color="#ffeecc" />
        <Suspense fallback={null}>
          <RobotModel />
          <Particles />
          <gridHelper args={[20, 40, '#aa8800', '#332200']} position={[0, -2.65, 0]} />
        </Suspense>
      </Canvas>
    </div>
  );
}
