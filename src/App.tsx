import { Suspense, useEffect } from 'react';
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
import { MainMenu } from './ui/MainMenu';
import { LoadingScreen } from './ui/LoadingScreen';
import { EffectComposer, Pixelation } from '@react-three/postprocessing';
import { ProjectileManager } from './entities/projectiles/ProjectileManager';
import { ZombieRenderer } from './entities/enemies/ZombieRenderer';
import { ParticleSystem } from './systems/ParticleSystem';
import { AudioManagerInit } from './systems/AudioManager';
import './core/pause';

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
  const gameState = useStore((state) => state.gameState);
  const setGameState = useStore((state) => state.setGameState);

  useEffect(() => {
    (window as any).__setGameState = setGameState;
    (window as any).__getStore = useStore.getState;
  }, [setGameState]);

  return (
    <>
      {gameState === 'menu' && <MainMenu />}
      <LoadingScreen />
      {(gameState === 'playing' || gameState === 'paused') && (
        <Canvas shadows camera={{ position: [0, 15, 10], fov: 50 }}>
          <color attach="background" args={['#202030']} />
          <fog attach="fog" args={['#202030', 20, 180]} />
          <ambientLight intensity={1.5} />
          <directionalLight
            position={[50, 100, 25]}
            intensity={2}
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
            shadow-camera-left={-200}
            shadow-camera-right={200}
            shadow-camera-top={200}
            shadow-camera-bottom={-200}
          />

          <Suspense fallback={null}>
            <Physics gravity={[0, -9.81, 0]} paused={gameState === 'paused'}>

              <Player />

              {currentLevel === 'procedural' ? <ProceduralLevel /> : <SimpleLevel />}
              <Ground />

              <ProjectileManager />
              <ZombieRenderer />
              <ParticleSystem />
              <AudioManagerInit />

            </Physics>
          </Suspense>

          {/* Retro Pixel Art Filter */}
          <EffectComposer>
            <Pixelation granularity={3} />
          </EffectComposer>
        </Canvas>
      )}
      <Cursor />
      {(gameState === 'playing' || gameState === 'paused') && <UI />}
    </>
  );
}
