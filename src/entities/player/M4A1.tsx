import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

export function M4A1() {
    const group = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/models/m4a1.glb');

    const clone = useMemo(() => {
        const clonedScene = SkeletonUtils.clone(scene);
        clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clonedScene;
    }, [scene]);

    return (
        <group ref={group} scale={[0.6, 0.6, 0.6]} position={[0, 30, 5]} rotation={[Math.PI * 0, Math.PI * 1, Math.PI * 0.4]}>
            <primitive object={clone} />
        </group>
    );
}

useGLTF.preload('/models/m4a1.glb');
