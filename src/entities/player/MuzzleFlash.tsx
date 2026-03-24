import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D } from 'three';
import { RapierRigidBody } from '@react-three/rapier';

export function MuzzleFlash({ activeRef, bodyRef, meshRef }: { activeRef: React.RefObject<number>, bodyRef: React.RefObject<RapierRigidBody | null>, meshRef: React.RefObject<Object3D | null> }) {
    const lightRef = useRef<any>(null);
    const hasLogged = useRef(false);

    useFrame(() => {
        if (!lightRef.current) return;

        if (!activeRef.current || activeRef.current === 0) {
            lightRef.current.intensity = 0;
            return;
        }

        const flashTime = (performance.now() - activeRef.current) / 1000;

        if (flashTime < 0.1) {
            const intensity = 10 * (1 - flashTime / 0.1);
            lightRef.current.intensity = intensity;

            if (!hasLogged.current) {
                hasLogged.current = true;
            }

            if (bodyRef.current && meshRef.current) {
                const position = bodyRef.current.translation();
                const direction = new Vector3();
                meshRef.current.getWorldDirection(direction);
                lightRef.current.position.set(
                    position.x + direction.x * 0.5,
                    position.y + 0.5,
                    position.z + direction.z * 0.5
                );
            }
        } else {
            lightRef.current.intensity = 0;
            hasLogged.current = false;
        }
    });

    return (
        <pointLight
            ref={lightRef}
            intensity={0}
            distance={15}
            decay={2}
            color="#ffaa00"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.1}
            shadow-camera-far={20}
        />
    );
}
