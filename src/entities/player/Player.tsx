import { useRef } from 'react';
import { RigidBody, RapierRigidBody, CapsuleCollider, interactionGroups } from '@react-three/rapier';
import { Group } from 'three';
import { CameraController } from './CameraController';
import { BonecoCompleto } from './BonecoCompleto';
import { usePlayerController } from './usePlayerController';
import { MuzzleFlash } from './MuzzleFlash';

export function Player() {
    const body = useRef<RapierRigidBody>(null);
    const mesh = useRef<Group>(null);

    // Engine Logic (Physics, Input, Shooting) is cleanly decoupled into the Controller Hook
    const { moveState, isShooting, flashStartTime } = usePlayerController(body, mesh);

    return (
        <>
            <RigidBody
                ref={body}
                position={[0, 1, 0]}
                enabledRotations={[false, false, false]} // Lock rotation so it doesn't roll
                colliders={false}
                friction={1}
                linearDamping={0.5} // Allow smooth lerp to handle sliding
                mass={100} // Very heavy player
                collisionGroups={interactionGroups(0, [0, 1])}
                userData={{ type: 'player' }}
            >
                <CapsuleCollider args={[0.5, 0.3]} />
                <group ref={mesh} name="player">
                    {/* Character Visual Model */}
                    <BonecoCompleto
                        scale={0.008}
                        position={[0, -0.8, 0]}
                        bodyRef={body}
                        isShootingRef={isShooting}
                        moveStateRef={moveState}
                    />
                </group>

            </RigidBody>
            <MuzzleFlash activeRef={flashStartTime} bodyRef={body} meshRef={mesh} />
            <CameraController target={body} />
        </>
    );
}
