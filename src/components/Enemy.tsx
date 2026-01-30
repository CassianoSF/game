import { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3, Raycaster } from 'three';
import type { EnemyData } from '../store';
import { useStore } from '../store';

type EnemyState = 'IDLE' | 'WANDER' | 'INVESTIGATE' | 'CHASE' | 'ATTACK';

export function Enemy({ data }: { data: EnemyData }) {
    const body = useRef<RapierRigidBody>(null);
    const [state, setState] = useState<EnemyState>('IDLE');
    const { scene, camera } = useThree();

    // AI Refs
    const lastKnownPos = useRef<Vector3 | null>(null);
    const wanderTarget = useRef<Vector3 | null>(null);
    const stateTimer = useRef(0);
    const raycaster = useMemo(() => new Raycaster(), []);

    // Stats
    const sightRange = 15;
    const hearingRange = 20;
    const fov = Math.PI / 2; // 90 degrees
    const memoryDuration = 5; // Seconds to remember last pos

    useFrame((stateCtx, delta) => {
        if (!body.current) return;

        const myPos = body.current.translation();
        const myVec = new Vector3(myPos.x, myPos.y, myPos.z);
        const playerMesh = scene.getObjectByName('player');

        // Defaults
        let targetPos: Vector3 | null = null;
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
                raycaster.set(myVec, dirToPlayer);
                raycaster.far = sightRange;
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
            console.log('Enemy is stunned, skipping movement');
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

        // Apply
        const currentVel = body.current.linvel();
        // Simple steering: lerp velocity for weight / inertia
        // For physics body, setting linvel directly is stiff, adding force is smoother.
        // Let's stick to setLinvel for direct control but maybe smooth the change?

        if (speed > 0 && desiredVelocity.lengthSq() > 0) {
            // Steering force: Desired velocity - Current velocity
            // But with impulse we just add direction * force
            // Better to just push them in desired direction if they aren't at max speed
            const maxSpeed = speed;
            const currentPlaneSpeed = new Vector3(currentVel.x, 0, currentVel.z).length();

            if (currentPlaneSpeed < maxSpeed) {
                // Apply impulse in direction of desired movement
                // We need a force factor to make them move against damping
                const force = 15; // Impulse strength per frame
                body.current.applyImpulse({
                    x: desiredVelocity.x * force * 0.016,
                    y: 0,
                    z: desiredVelocity.z * force * 0.016
                }, true);
            }
        }
    });

    return (
        <RigidBody
            ref={body}
            position={data.position}
            colliders="ball"
            lockRotations
            friction={1}
            linearDamping={10}
            userData={{ type: 'enemy', id: data.id }}
        >
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.7, 16, 16]} />
                <meshStandardMaterial color={
                    state === 'ATTACK' ? 'red' :
                        state === 'CHASE' ? 'orange' :
                            state === 'INVESTIGATE' ? 'yellow' :
                                state === 'WANDER' ? 'blue' : 'green'
                } />
                {/* Vision Cone visual for debug? */}
            </mesh>
        </RigidBody >
    );
}
