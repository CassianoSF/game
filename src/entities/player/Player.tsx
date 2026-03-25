import { useRef, forwardRef, useImperativeHandle } from 'react';
import { RigidBody, RapierRigidBody, CapsuleCollider, interactionGroups } from '@react-three/rapier';
import { Group, Vector3 } from 'three';
import { CameraController } from './CameraController';
import { BonecoCompleto, type BonecoRef } from './BonecoCompleto';
import { usePlayerController } from './usePlayerController';
import { MuzzleFlash } from './MuzzleFlash';

export interface PlayerRef {
    getMuzzlePosition: () => Vector3;
}

export const Player = forwardRef<PlayerRef>((_, ref) => {
    const body = useRef<RapierRigidBody>(null);
    const mesh = useRef<Group>(null);
    const characterRef = useRef<BonecoRef>(null);

    // Engine Logic (Physics, Input, Shooting) is cleanly decoupled into the Controller Hook
    const { moveState, isShooting, flashStartTime } = usePlayerController(body, mesh, characterRef);

    useImperativeHandle(ref, () => ({
        getMuzzlePosition: () => characterRef.current?.getMuzzlePosition() || new Vector3()
    }));

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
                        ref={characterRef}
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
});

Player.displayName = 'Player';
