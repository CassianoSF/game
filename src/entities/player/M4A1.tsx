import * as THREE from 'three';
import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';

export interface M4A1Ref {
    muzzlePosition: THREE.Vector3;
    getWorldPosition: () => THREE.Vector3;
}

export const M4A1 = forwardRef<M4A1Ref>((_, ref) => {
    const group = useRef<THREE.Group>(null);
    const muzzleRef = useRef<THREE.Group>(null);
    const { scene } = useGLTF('/models/m4a1.glb');

    useImperativeHandle(ref, () => ({
        muzzlePosition: new THREE.Vector3(),
        getWorldPosition: () => {
            if (muzzleRef.current) {
                const pos = new THREE.Vector3();
                muzzleRef.current.getWorldPosition(pos);
                return pos;
            }
            return new THREE.Vector3();
        }
    }));

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
            <group ref={muzzleRef} position={[70, 10, 0]} />
        </group>
    );
});

M4A1.displayName = 'M4A1';

useGLTF.preload('/models/m4a1.glb');
