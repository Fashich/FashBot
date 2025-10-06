import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, PointMaterial, Points, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export function CrystalBackground() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 12], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.45} />
        <pointLight position={[8, 12, 18]} intensity={1.4} color={0x7dd3fc} />
        <pointLight position={[-12, -10, -6]} intensity={1.1} color={0xa855f7} />
        <Suspense fallback={null}>
          <group position={[0, -0.5, 0]}>
            <RotatingCrystal />
            <Sparkles
              count={80}
              scale={24}
              size={2.6}
              speed={0.2}
              color="#8BE9FE"
              opacity={0.4}
            />
            <FloatingParticles />
          </group>
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-fashbot-radial opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/40 dark:from-black/50 dark:via-black/10 dark:to-black/60" />
    </div>
  );
}

function RotatingCrystal() {
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (crystalRef.current) {
      crystalRef.current.rotation.x = Math.sin(t / 3) * 0.6 + 0.4;
      crystalRef.current.rotation.y = t / 3;
      crystalRef.current.rotation.z = Math.cos(t / 4) * 0.4;
    }
  });

  return (
    <Float floatIntensity={1.8} rotationIntensity={0.6} speed={1.2}>
      <Icosahedron args={[2.8, 0]} ref={crystalRef}>
        <meshPhysicalMaterial
          color="#8BE9FE"
          metalness={0.55}
          roughness={0.12}
          transmission={0.92}
          ior={1.45}
          thickness={0.7}
          emissive="#60a5fa"
          emissiveIntensity={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Icosahedron>
      <mesh scale={3.2}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#bfdbfe" wireframe opacity={0.18} transparent />
      </mesh>
    </Float>
  );
}

function FloatingParticles() {
  const positions = useMemo(() => {
    const arr = new Float32Array(1800);
    for (let i = 0; i < arr.length; i += 3) {
      const radius = 10 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, []);

  const speeds = useMemo(() =>
    new Array(positions.length / 3).fill(0).map(() => 0.0008 + Math.random() * 0.0015),
  [positions.length]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (!pointsRef.current) return;
    const positionsAttribute = pointsRef.current.geometry.getAttribute("position");
    for (let i = 0; i < positionsAttribute.count; i++) {
      const y = positionsAttribute.getY(i) + speeds[i];
      positionsAttribute.setY(i, y > 12 ? -12 : y);
    }
    positionsAttribute.needsUpdate = true;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3} frustumCulled>
      <PointMaterial
        transparent
        vertexColors={false}
        color="#a5f3fc"
        size={0.16}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}
