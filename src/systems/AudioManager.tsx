import * as THREE from 'three';
import { useThree, useLoader } from '@react-three/fiber';
import { useEffect } from 'react';

export const ASSET_LIST = [
    'sounds/rifle_shot.ogg',
    'sounds/shotgun_shot.ogg',
    'sounds/pistol_shot.ogg',
    'sounds/machine_gun/rifle.ogg',
    'sounds/machine_gun/rifle2.ogg',
    'sounds/machine_gun/rifle3.ogg',
    'sounds/shotgun/shotgun.ogg',
    'sounds/shotgun/shotgun2.ogg',
    'sounds/shotgun/shotgun3.ogg',
    'sounds/footsteps/Footstep_Dirt_00.mp3',
    'sounds/footsteps/Footstep_Dirt_01.mp3',
    'sounds/footsteps/Footstep_Dirt_02.mp3',
    'sounds/footsteps/Footstep_Dirt_03.mp3',
    'sounds/footsteps/Footstep_Dirt_04.mp3',
    'sounds/footsteps/Footstep_Dirt_05.mp3',
    'sounds/footsteps/Footstep_Dirt_06.mp3',
    'sounds/footsteps/Footstep_Dirt_07.mp3',
    'sounds/footsteps/Footstep_Dirt_08.mp3',
    'sounds/footsteps/Footstep_Dirt_09.mp3',
    'sounds/zombie_hit/0.wav',
    'sounds/zombie_hit/1.wav',
    'sounds/zombie_hit/2.wav',
    'sounds/zombie_hit/3.wav',
    'sounds/zombie_attack/0.ogg',
    'sounds/zombie_attack/1.ogg',
    'sounds/zombie_attack/2.ogg',
    'sounds/zombie_sound/0.mp3',
    'sounds/zombie_sound/1.mp3',
    'sounds/zombie_sound/2.mp3',
    'sounds/zombie_sound/3.mp3',
    'sounds/zombie_sound/4.mp3',
    'sounds/zombie_sound/5.mp3',
    'sounds/theme05.ogg',
    'sounds/reload.ogg',
    'sounds/weapswitch.ogg',
    'sounds/melee1.wav'
];

// Decoupled AAA Audio Engine mapping strictly to AudioContext
export const audioAPI = {
    listener: new THREE.AudioListener(),
    bufferCache: new Map<string, AudioBuffer>(),
    positionalEmitters: [] as THREE.PositionalAudio[],
    globalEmitters: [] as THREE.Audio[],
    bgmElement: null as THREE.Audio | null,
    currentBGM: '',

    init: (scene: THREE.Scene) => {
        if (audioAPI.positionalEmitters.length > 0) return; // Already initialized

        // Create a pool of 30 3D positional emitters
        for (let i = 0; i < 200; i++) {
            const emitter = new THREE.PositionalAudio(audioAPI.listener);
            emitter.setRefDistance(3);
            emitter.setMaxDistance(40);
            emitter.setRolloffFactor(1.5);
            scene.add(emitter);
            audioAPI.positionalEmitters.push(emitter);
        }

        // Create a pool of 15 2D global emitters (For gunshots, UI)
        for (let i = 0; i < 200; i++) {
            audioAPI.globalEmitters.push(new THREE.Audio(audioAPI.listener));
        }

        audioAPI.bgmElement = new THREE.Audio(audioAPI.listener);
        audioAPI.bgmElement.setLoop(true);
        audioAPI.bgmElement.setVolume(0.2);
    },

    play2D: (url: string, volume = 0.5) => {
        const emitter = audioAPI.globalEmitters.find(e => !e.isPlaying);
        if (!emitter || !audioAPI.bufferCache.has(url)) return;

        emitter.setBuffer(audioAPI.bufferCache.get(url)!);
        emitter.setVolume(volume);
        emitter.play();
    },

    play3D: (url: string, position: THREE.Vector3 | { x: number, y: number, z: number }, volume = 1.0) => {
        const emitter = audioAPI.positionalEmitters.find(e => !e.isPlaying);
        if (!emitter || !audioAPI.bufferCache.has(url)) return;

        emitter.position.set(position.x, position.y, position.z);
        emitter.setVolume(volume);
        emitter.setBuffer(audioAPI.bufferCache.get(url)!);
        emitter.play();
    },

    playBGM: (url: string) => {
        if (!audioAPI.bgmElement || !audioAPI.bufferCache.has(url)) return;
        if (audioAPI.currentBGM === url && audioAPI.bgmElement.isPlaying) return;

        if (audioAPI.bgmElement.isPlaying) audioAPI.bgmElement.stop();

        audioAPI.currentBGM = url;
        audioAPI.bgmElement.setBuffer(audioAPI.bufferCache.get(url)!);
        audioAPI.bgmElement.play();
    }
};

export function AudioManagerInit() {
    const { scene, camera } = useThree();

    // This hook universally blocks the <Suspense> component (and powers LoadingScreen.tsx)
    // until every byte of these audio arrays is downloaded into browser memory caching
    const buffers = useLoader(THREE.AudioLoader, ASSET_LIST.map(a => `/${a}`));

    useEffect(() => {
        ASSET_LIST.forEach((url, i) => {
            audioAPI.bufferCache.set(url, buffers[i]);
        });

        camera.add(audioAPI.listener);
        audioAPI.init(scene);

        return () => {
            camera.remove(audioAPI.listener);
            audioAPI.positionalEmitters.forEach(e => {
                if (e.isPlaying) e.stop();
                scene.remove(e);
            });
            audioAPI.globalEmitters.forEach(e => {
                if (e.isPlaying) e.stop();
            });
            audioAPI.positionalEmitters = [];
            audioAPI.globalEmitters = [];
            if (audioAPI.bgmElement?.isPlaying) audioAPI.bgmElement.stop();
        };
    }, [scene, camera, buffers]);

    return null;
}
