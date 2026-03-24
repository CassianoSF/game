import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody, CapsuleCollider } from '@react-three/rapier';
import { Vector3, Raycaster, Plane, Mesh, Quaternion, MathUtils } from 'three';
import { CameraController } from './CameraController';
import { useStore } from '../store';
import { BonecoCompleto } from './BonecoCompleto';

export function Player() {
    const body = useRef<RapierRigidBody>(null);
    const mesh = useRef<Mesh>(null);
    const activeSlot = useStore((state) => state.activeSlot);
    const hotbar = useStore((state) => state.hotbar);
    const addProjectile = useStore((state) => state.addProjectile);
    const equippedWeapon = hotbar[activeSlot];
    const { camera } = useThree();

    // Reuse Vector3 objects to avoid allocation
    const camForward = useMemo(() => new Vector3(), []);
    const camRight = useMemo(() => new Vector3(), []);
    const direction = useMemo(() => new Vector3(), []);

    // Controls
    const keys = useRef<{ [key: string]: boolean }>({});
    const isShooting = useRef(false);
    const lastShootTime = useRef(0);
    // Remove static fireRate

    // Setup input listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
        const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 0) isShooting.current = true;
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 0) isShooting.current = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const shoot = () => {
        if (!equippedWeapon) return;

        if (body.current && mesh.current) {
            const position = body.current.translation();
            const direction = new Vector3();
            const quaternion = new Quaternion();
            mesh.current.getWorldDirection(direction);
            mesh.current.getWorldQuaternion(quaternion);

            const offset = 0.8;

            // Handle multiple projectiles (Shotgun)
            for (let i = 0; i < equippedWeapon.stats.projectiles; i++) {
                // Apply Spread
                // Simple spread: rotate direction vector slightly around Y axis
                // A better way for 3D is a random point in a cone, but Y-axis spread is enough for top-down
                const spreadAngle = (Math.random() - 0.5) * equippedWeapon.stats.spread; // radians approx

                // Rotate direction by spread
                const spreadDir = direction.clone().applyAxisAngle(new Vector3(0, 1, 0), spreadAngle);

                // We also need to rotate the visual mesh or quaternion? 
                // Projectile uses direction for velocity, so that's fine.
                // It uses rotation for visual mesh. Ideally we rotate that too.
                const spreadQuat = quaternion.clone();
                // Applying spread to quaternion is complex, let's just rely on velocity for now 
                // and maybe let Projectile align itself to velocity if we change it to do so?
                // Current Projectile implementation: 
                // 1. Sets linvel based on direction.
                // 2. Sets visual rotation based on passed rotation.
                // So we SHOULD adjust the passed rotation too if we want it to look right.

                // Let's create a rotation quaternion for the spread
                const axis = new Vector3(0, 1, 0);
                const qSpread = new Quaternion().setFromAxisAngle(axis, spreadAngle);
                spreadQuat.multiply(qSpread);


                const startPos: [number, number, number] = [
                    position.x + direction.x * offset * 5,
                    position.y,
                    position.z + direction.z * offset
                ];

                addProjectile({
                    id: crypto.randomUUID(),
                    position: startPos,
                    direction: [spreadDir.x, spreadDir.y, spreadDir.z],
                    rotation: [spreadQuat.x, spreadQuat.y, spreadQuat.z, spreadQuat.w],
                    stats: equippedWeapon.stats
                });
            }
        }
    };

    // ... raycaster setup ...

    useFrame((state, delta) => {
        // Shooting Loop
        if (isShooting.current && equippedWeapon) {
            if (state.clock.elapsedTime - lastShootTime.current > equippedWeapon.stats.fireRate) {
                shoot();
                lastShootTime.current = state.clock.elapsedTime;
            }
        }

        if (!body.current || !mesh.current) return;

        // --- Movement (WASD) ---
        const speed = 5;
        direction.set(0, 0, 0);

        // Get camera forward direction (projected to XZ plane)
        camera.getWorldDirection(camForward);
        const tempForward = camForward.clone();
        tempForward.y = 0;
        tempForward.normalize();

        camRight.crossVectors(tempForward, new Vector3(0, 1, 0));

        if (keys.current['w']) direction.add(tempForward);
        if (keys.current['s']) direction.sub(tempForward);
        if (keys.current['a']) direction.sub(camRight);
        if (keys.current['d']) direction.add(camRight);

        if (direction.length() > 0) {
            direction.normalize().multiplyScalar(speed);
        }

        // Velocity-based smooth movement
        const currentVel = body.current.linvel();
        const lerpFactor = 10 * delta; // Snappy responsiveness

        // We lerp the X and Z velocity to the target direction. 
        // This naturally dampens knockbacks over time while keeping control tight.
        const newX = MathUtils.lerp(currentVel.x, direction.x, lerpFactor);
        const newZ = MathUtils.lerp(currentVel.z, direction.z, lerpFactor);

        // Preserve Y velocity for gravity
        body.current.setLinvel({ x: newX, y: currentVel.y, z: newZ }, true);
    });

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
                userData={{ type: 'player' }}
            >
                <CapsuleCollider args={[0.5, 0.3]} />
                <group ref={mesh} name="player">
                    {/* Scale and offset character so feet touch bottom of sphere */}
                    <BonecoCompleto scale={0.008} position={[0, -0.8, 0]} bodyRef={body} isShootingRef={isShooting} />

                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[0.1, 0.1, 0.2]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                </group>

                {/* Aim Logic Helper */}
                <AimLogic body={body} mesh={mesh} />
            </RigidBody>
            <CameraController target={body} />
        </>
    );
}

function AimLogic({ body, mesh }: { body: any, mesh: any }) {
    const { camera, pointer } = useThree();
    const raycaster = new Raycaster();
    const plane = new Plane(new Vector3(0, 1, 0), 0);
    const isCameraDragging = useStore((state) => state.isCameraDragging);

    // Store the pointer position when dragging starts
    const lockedPointer = useRef(new Vector3());

    useFrame(() => {
        if (!body.current || !mesh.current) return;

        // If not dragging, update locked pointer to current pointer
        if (!isCameraDragging) {
            lockedPointer.current.set(pointer.x, pointer.y, 0);
        }

        // Always raycast, but use lockedPointer if dragging
        // lockedPointer holds values in normalized device coordinates (-1 to +1) just like pointer
        raycaster.setFromCamera({ x: lockedPointer.current.x, y: lockedPointer.current.y } as any, camera);

        const target = new Vector3();
        raycaster.ray.intersectPlane(plane, target);

        if (target) {
            const playerPos = body.current.translation();
            // Look at target (restricted to Y axis)
            mesh.current.lookAt(target.x, playerPos.y, target.z);
        }
    });
    return null;
}
