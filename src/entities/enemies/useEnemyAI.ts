import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, MathUtils, Raycaster } from 'three';
import type { EnemyData } from '../../core/store';
import { useStore } from '../../core/store';
import { RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';

export type EnemyState = 'IDLE' | 'WANDER' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'DEAD';

export function useEnemyAI(
    data: EnemyData,
    bodyRef: React.RefObject<RapierRigidBody | null>,
    meshRef: React.RefObject<THREE.Group | null>
) {
    const isDead = data.isDead;
    const [state, setState] = useState<EnemyState>('IDLE');
    const { scene } = useThree();
    const removeEnemy = useStore(state => state.removeEnemy);

    // AI Refs
    const lastKnownPos = useRef<Vector3 | null>(null);
    const wanderTarget = useRef<Vector3 | null>(null);
    const stateTimer = useRef(0);
    const deathAnimationFinished = useRef(false);

    // Stats
    const sightRange = 15;
    const hearingRange = 20;
    const memoryDuration = 5; // Seconds to remember last pos

    useEffect(() => {
        if (isDead) {
            const timer = setTimeout(() => {
                removeEnemy(data.id);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isDead, data.id, removeEnemy]);

    // Pre-allocated vectors for performance (avoids GC stutter)
    const myVec = useMemo(() => new Vector3(), []);
    const playerPos = useMemo(() => new Vector3(), []);
    const dirToPlayer = useMemo(() => new Vector3(), []);
    const tempRaycaster = useMemo(() => new Raycaster(), []);
    const desiredVelocity = useMemo(() => new Vector3(), []);

    useFrame((_stateCtx, delta) => {
        if (!bodyRef.current) return;

        if (isDead) {
            if (!deathAnimationFinished.current) {
                deathAnimationFinished.current = true;
            }
            return;
        }

        const myPos = bodyRef.current.translation();
        myVec.set(myPos.x, myPos.y, myPos.z);
        const playerMesh = scene.getObjectByName('player');

        // Defaults
        let canSeePlayer = false;
        let canHearPlayer = false;

        if (playerMesh) {
            playerMesh.getWorldPosition(playerPos);
            const dist = myVec.distanceTo(playerPos);
            dirToPlayer.subVectors(playerPos, myVec).normalize();

            // Sight Check
            if (dist < sightRange) {
                tempRaycaster.set(myVec, dirToPlayer);
                tempRaycaster.far = sightRange;
                canSeePlayer = true;
            }

            // Hearing Check 
            if (dist < hearingRange) {
                canHearPlayer = true;
            }

            if (canSeePlayer) {
                lastKnownPos.current = playerPos.clone();
                stateTimer.current = memoryDuration; 
            }
        }

        // --- STATE MACHINE ---
        switch (state) {
            case 'IDLE':
                if (canSeePlayer) setState('CHASE');
                else if (canHearPlayer && lastKnownPos.current) setState('INVESTIGATE');
                else {
                    if (Math.random() < 0.01) {
                        wanderTarget.current = new Vector3(
                            myPos.x + (Math.random() - 0.5) * 10,
                            myPos.y,
                            myPos.z + (Math.random() - 0.5) * 10
                        );
                        setState('WANDER');
                    }
                }
                break;

            case 'WANDER':
                if (canSeePlayer) setState('CHASE');
                else if (canHearPlayer && lastKnownPos.current) setState('INVESTIGATE');
                else if (wanderTarget.current) {
                    const distToTarget = myVec.distanceTo(wanderTarget.current);
                    if (distToTarget < 1) {
                        setState('IDLE');
                        wanderTarget.current = null;
                    }
                } else {
                    setState('IDLE');
                }
                break;

            case 'CHASE':
                if (!canSeePlayer) {
                    setState('INVESTIGATE'); 
                } else {
                    const dist = myVec.distanceTo(playerPos);
                    if (dist < 2) setState('ATTACK');
                }
                break;

            case 'ATTACK':
                if (!canSeePlayer) setState('INVESTIGATE');
                else {
                    const dist = myVec.distanceTo(playerPos);
                    if (dist > 3) setState('CHASE');
                }
                break;

            case 'INVESTIGATE':
                if (canSeePlayer) setState('CHASE');
                else if (lastKnownPos.current) {
                    const dist = myVec.distanceTo(lastKnownPos.current);
                    if (dist < 1) {
                        stateTimer.current -= delta;
                        if (stateTimer.current <= 0) {
                            lastKnownPos.current = null;
                            setState('IDLE');
                        }
                    }
                } else {
                    setState('IDLE');
                }
                break;
        }

        // --- MOVEMENT ---
        const stunTime = useStore.getState().stunnedEnemies[data.id];
        if (stunTime && stunTime > Date.now()) {
            return;
        }

        desiredVelocity.set(0, 0, 0);
        let speed = 2; 

        if (state === 'CHASE' && lastKnownPos.current) {
            speed = 6; 
            desiredVelocity.subVectors(lastKnownPos.current, myVec).normalize().multiplyScalar(speed);
        } else if (state === 'ATTACK') {
            desiredVelocity.set(0, 0, 0);
        } else if (state === 'WANDER' && wanderTarget.current) {
            desiredVelocity.subVectors(wanderTarget.current, myVec).normalize().multiplyScalar(speed);
        } else if (state === 'INVESTIGATE' && lastKnownPos.current) {
            speed = 4;
            desiredVelocity.subVectors(lastKnownPos.current, myVec).normalize().multiplyScalar(speed);
        }

        const currentVel = bodyRef.current.linvel();
        const lerpFactor = 5 * delta;

        const newX = MathUtils.lerp(currentVel.x, desiredVelocity.x, lerpFactor);
        const newZ = MathUtils.lerp(currentVel.z, desiredVelocity.z, lerpFactor);

        bodyRef.current.setLinvel({ x: newX, y: currentVel.y, z: newZ }, true);

        if (!isDead && desiredVelocity.lengthSq() > 0.1 && meshRef.current) {
            const angle = Math.atan2(desiredVelocity.x, desiredVelocity.z);
            meshRef.current.rotation.set(0, angle, 0);
        }
    });

    return { state };
}
