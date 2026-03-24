import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, NearestFilter } from 'three';
import { Player } from './entities/player/Player';
import { useStore } from './core/store';
import { ProceduralLevel } from './environments/ProceduralLevel';
import { SimpleLevel } from './environments/SimpleLevel';
import { Cursor } from './ui/Cursor';
import { UI } from './ui/UI';
import { LoadingScreen } from './ui/LoadingScreen';
import { ProjectileManager } from './entities/projectiles/ProjectileManager';
import { ZombieRenderer } from './entities/enemies/ZombieRenderer';

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
    tex.repeat.set(250, 250);
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
  const currentLevel = useStore((state) => state.currentLevel);

  return (
    <>
      <LoadingScreen />
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

        <Suspense fallback={null}>
          <Physics gravity={[0, -9.81, 0]}>
            <Player />

            {currentLevel === 'procedural' ? <ProceduralLevel /> : <SimpleLevel />}
            <Ground />

            <ProjectileManager />
            <ZombieRenderer />

          </Physics>
        </Suspense>
      </Canvas>
      <Cursor />
      <UI />
    </>
  );
}
