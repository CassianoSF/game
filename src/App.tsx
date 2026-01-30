import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { Suspense, useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, NearestFilter } from 'three';
import { Player } from './components/Player';
import { useStore } from './store';
import { Projectile } from './components/Projectile';
import { Level } from './components/Level';
import { Cursor } from './components/Cursor';
import { UI } from './components/UI';

function Ground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2; // Smallest possible for 2x2 check
    canvas.height = 2;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = 'white';
      context.fillRect(0, 0, 2, 2);
      context.fillStyle = 'gray'; // or #808080
      context.fillRect(0, 0, 1, 1);
      context.fillRect(1, 1, 1, 1);
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(15, 15);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
    tex.colorSpace = 'srgb'; // Correct color space
    return tex;
  }, []);

  return (
    <RigidBody type="fixed" colliders="cuboid" friction={1}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={texture} />
      </mesh>
    </RigidBody>
  );
}

function App() {
  return (
    <>
      <Canvas shadows camera={{ position: [0, 20, 10], fov: 50 }}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <Suspense fallback={null}>
          <Physics debug>
            <Ground />
            <Player />
            <Level />
            <ProjectileManager />
          </Physics>
        </Suspense>
      </Canvas>
      <Cursor />
      <UI />
    </>
  );
}

function ProjectileManager() {
  const projectiles = useStore((state) => state.projectiles);
  return (
    <>
      {projectiles.map((p) => (
        <Projectile key={p.id} data={p} />
      ))}
    </>
  );
}

export default App;
