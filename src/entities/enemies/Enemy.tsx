import { useRef, memo, useState, useEffect } from 'react';
import { RigidBody, RapierRigidBody, CapsuleCollider, interactionGroups } from '@react-three/rapier';
import type { EnemyData } from '../../core/store';
import * as THREE from 'three';
import { useEnemyAI } from './useEnemyAI';
import { zombieRendererAPI } from './ZombieRenderer';
import { useFrame } from '@react-three/fiber';
import meta from '../../../public/models/VAT_Meta.json';

export const Enemy = memo(function Enemy({ data }: { data: EnemyData }) {
    const body = useRef<RapierRigidBody | null>(null);
    const meshRef = useRef<THREE.Group | null>(null);
    
    // Abstract AI Logic Decoupled
    const { state } = useEnemyAI(data, body, meshRef);
    const isDead = data.isDead;

    // VAT Instancing System (Hybrid ECS)
    const [slot] = useState(() => zombieRendererAPI.register());
    const animTimer = useRef(0);
    const prevState = useRef<string | null>(null);

    useEffect(() => {
        return () => zombieRendererAPI.unregister(slot);
    }, [slot]);

    // Forceful Rust WASM collision disconnect
    useEffect(() => {
        if (isDead && body.current) {
            // Apply group changes to all child colliders, as RigidBodies themselves don't hold collision groups
            const numColliders = body.current.numColliders();
            for (let i = 0; i < numColliders; i++) {
                const collider = body.current.collider(i);
                if (collider) collider.setCollisionGroups(interactionGroups(3, []));
            }
        }
    }, [isDead]);

    useFrame((_ctx, delta) => {
        if (!zombieRendererAPI.instancedMesh || !zombieRendererAPI.frameAttribute || !meshRef.current) return;

        // 1. Sync Physics Matrix to the Global GPU InstancedMesh
        meshRef.current.updateMatrixWorld(true);
        zombieRendererAPI.instancedMesh.setMatrixAt(slot, meshRef.current.matrixWorld);
        zombieRendererAPI.instancedMesh.instanceMatrix.needsUpdate = true;

        // 2. Sync VAT Animation Frame
        const currentState = isDead ? 'DEAD' : state;
        if (prevState.current !== currentState) {
            animTimer.current = 0;
            prevState.current = currentState;
        }

        let animName = 'zombie idle';
        switch (currentState) {
            case 'IDLE': animName = 'zombie idle'; break;
            case 'WANDER':
            case 'INVESTIGATE': animName = 'zombie walk'; break;
            case 'CHASE': animName = 'zombie run'; break;
            case 'ATTACK': animName = 'zombie attack'; break;
            case 'DEAD': animName = 'zombie death'; break;
        }

        const animData = (meta.animations as any)[animName];
        if (animData) {
            animTimer.current += delta;
            let time = animTimer.current;
            
            // If dead, freeze on the last frame
            if (currentState === 'DEAD' && time > animData.duration) {
                time = animData.duration;
            } else if (currentState !== 'DEAD') {
                time = time % animData.duration;
            }

            const frameRatio = time / animData.duration;
            const currentFrame = Math.floor(animData.start + frameRatio * (animData.end - animData.start));
            zombieRendererAPI.frameAttribute.setX(slot, currentFrame);
            zombieRendererAPI.frameAttribute.needsUpdate = true;
        }
    });

    return (
        <RigidBody
            type={isDead ? 'fixed' : 'dynamic'}
            ref={body}
            sensor={isDead}
            position={data.position}
            enabledTranslations={[!isDead, !isDead, !isDead]} // Freeze in place when dead
            colliders={false}
            collisionGroups={interactionGroups(1, [0, 1, 2])}
            lockRotations
            friction={1}
            restitution={0}
            linearDamping={1}
            angularDamping={1}
            mass={60}
            ccd={true}
            userData={{ type: isDead ? 'corpse' : 'enemy', id: data.id }}
        >
            <CapsuleCollider args={[0.5, 0.3]} />
            {/* The visual offset/scale remains exactly the same, but geometry is stripped! */}
            <group ref={meshRef} name="enemy" scale={0.008} position={[0, -0.8, 0]} />
        </RigidBody>
    );
});
