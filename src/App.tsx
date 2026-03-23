import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, NearestFilter } from 'three';
import { Player } from './components/Player';
import { useStore } from './store';
import { Projectile } from './components/Projectile';
import { ProceduralLevel } from './components/ProceduralLevel';
import { SimpleLevel } from './components/SimpleLevel';
import { Cursor } from './components/Cursor';
import { UI } from './components/UI';

function Ground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#444'; // Dark gray background
      context.fillRect(0, 0, 64, 64);

      // Checkboard pattern
      context.fillStyle = '#555'; // Slightly lighter gray
      context.fillRect(0, 0, 32, 32);
      context.fillRect(32, 32, 32, 32);
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(1000, 1000);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
    return tex;
  }, []);

  return (
    <RigidBody type="fixed" friction={1}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </RigidBody>
  );
}

export default function App() {
  const projectiles = useStore((state) => state.projectiles);
  // Memoize to avoid creating new array on every render
  const projectileList = useMemo(() => Object.values(projectiles), [projectiles]);
  const currentLevel = useStore((state) => state.currentLevel);

  return (
    <>
      <Canvas shadows camera={{ position: [0, 15, 10], fov: 50 }}>
        <color attach="background" args={['#202030']} />
        <fog attach="fog" args={['#202030', 20, 180]} />
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <Physics gravity={[0, -9.81, 0]}>
          <Player />

          {currentLevel === 'procedural' ? <ProceduralLevel /> : <SimpleLevel />}
          <Ground />

          {/* Projectiles */}
          {projectileList.map((p) => (
            <Projectile key={p.id} data={p} />
          ))}

        </Physics>
      </Canvas>
      <Cursor />
      <UI />
    </>
  );
}
