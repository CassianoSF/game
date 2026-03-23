import { useRef, useState, memo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import { Vector3, MathUtils, Raycaster } from 'three';
import type { EnemyData } from '../store';
import { useStore } from '../store';
import { ZombieCompleto } from './ZombieCompleto';
import * as THREE from 'three';

type EnemyState = 'IDLE' | 'WANDER' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'DEAD';

export const Enemy = memo(function Enemy({ data }: { data: EnemyData }) {
    const body = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Group>(null);
    const [state, setState] = useState<EnemyState>('IDLE');
    const { scene } = useThree();
    const removeEnemy = useStore(state => state.removeEnemy);
    const isDead = data.isDead;

    useEffect(() => {
        if (isDead) {
            const timer = setTimeout(() => {
                removeEnemy(data.id);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isDead, data.id, removeEnemy]);

    // AI Refs
    const lastKnownPos = useRef<Vector3 | null>(null);
    const wanderTarget = useRef<Vector3 | null>(null);
    const stateTimer = useRef(0);

    // Stats
    const sightRange = 15;
    const hearingRange = 20;
    const memoryDuration = 5; // Seconds to remember last pos

    useFrame((_stateCtx, delta) => {
        if (!body.current) return;

        const myPos = body.current.translation();
        const myVec = new Vector3(myPos.x, myPos.y, myPos.z);
        const playerMesh = scene.getObjectByName('player');

        // Defaults
        let canSeePlayer = false;
        let canHearPlayer = false;
        const playerPos = new Vector3();

        // --- SENSORS ---
        if (playerMesh) {
            playerMesh.getWorldPosition(playerPos);
            const dist = myVec.distanceTo(playerPos);
            const dirToPlayer = new Vector3().subVectors(playerPos, myVec).normalize();

            // 1. Sight Check
            if (dist < sightRange) {
                // FOV Check (dot product) - forward is roughly velocity or previous dir?
                // For simplicity, assume 360 vision or check body velocity
                const tempRaycaster = new Raycaster(myVec, dirToPlayer);
                tempRaycaster.far = sightRange;
                // Intersect mainly walls (static) and player
                // NOTE: This is expensive if many objects. Ideally raycast against 'environment' layer.
                // For now, simple distance check + 'walls' check if we had tags.
                // Assuming no obstacles for first pass or simple raycast.
                canSeePlayer = true;
                // We'd cast a ray here to check for walls. 
            }

            // 2. Hearing Check (Placeholder: if player is close, we hear footsteps/gunshots)
            // Realistically we'd hook into an event bus for "Gunshot". 
            // For now, assume player making noise if moving or shooting.
            if (dist < hearingRange) {
                canHearPlayer = true;
            }

            if (canSeePlayer) {
                lastKnownPos.current = playerPos.clone();
                stateTimer.current = memoryDuration; // Reset memory timer
            }
        }

        // --- STATE MACHINE ---
        switch (state) {
            case 'IDLE':
                if (canSeePlayer) setState('CHASE');
                else if (canHearPlayer && lastKnownPos.current) setState('INVESTIGATE');
                else {
                    // Switch to WANDER occasionally
                    if (Math.random() < 0.01) {
                        // Pick random point
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
                    setState('INVESTIGATE'); // Go to last known
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
                        // Reached last known pos, look around?
                        // If timer expires, give up
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

        // --STEERING / MOVEMENT--

        // Check for Stun(Knockback) - Use Global Store State
        const stunTime = useStore.getState().stunnedEnemies[data.id];
        if (stunTime && stunTime > Date.now()) {
            return;
        }

        const desiredVelocity = new Vector3();
        let speed = 2; // Walk

        if (state === 'CHASE' && lastKnownPos.current) {
            speed = 6; // Run
            desiredVelocity.subVectors(lastKnownPos.current, myVec).normalize().multiplyScalar(speed);
        } else if (state === 'ATTACK') {
            desiredVelocity.set(0, 0, 0);
        } else if (state === 'WANDER' && wanderTarget.current) {
            desiredVelocity.subVectors(wanderTarget.current, myVec).normalize().multiplyScalar(speed);
        } else if (state === 'INVESTIGATE' && lastKnownPos.current) {
            speed = 4; // Trot
            desiredVelocity.subVectors(lastKnownPos.current, myVec).normalize().multiplyScalar(speed);
        }

        // Velocity-based smooth movement
        const currentVel = body.current.linvel();
        // Enemies are slightly less responsive/snappy than the player
        const lerpFactor = 5 * delta;

        // Ensure Y velocity is preserved for gravity falling
        const newX = MathUtils.lerp(currentVel.x, desiredVelocity.x, lerpFactor);
        const newZ = MathUtils.lerp(currentVel.z, desiredVelocity.z, lerpFactor);

        body.current.setLinvel({ x: newX, y: currentVel.y, z: newZ }, true);

        // Visual Rotation (Mesh only, physics body is rotation-locked)
        if (desiredVelocity.lengthSq() > 0.1 && meshRef.current) {
            const angle = Math.atan2(desiredVelocity.x, desiredVelocity.z);
            meshRef.current.rotation.set(0, angle, 0);
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
            <group ref={meshRef} name="enemy">
                <ZombieCompleto scale={0.008} position={[0, -0.8, 0]} bodyRef={body} state={isDead ? 'DEAD' : state} />
            </group>
        </RigidBody >
    );
});
