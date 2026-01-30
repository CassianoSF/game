import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { Vector3, Raycaster, Plane, Mesh, Quaternion } from 'three';
import { CameraController } from './CameraController';
import { useStore } from '../store';

export function Player() {
    const body = useRef<RapierRigidBody>(null);
    const mesh = useRef<Mesh>(null);
    const activeSlot = useStore((state) => state.activeSlot);
    const hotbar = useStore((state) => state.hotbar);
    const addProjectile = useStore((state) => state.addProjectile);
    const equippedWeapon = hotbar[activeSlot];
    const { camera } = useThree();

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

            const offset = 2.0;

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
                    position.x + direction.x * offset,
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

    useFrame((state) => {
        // Shooting Loop
        if (isShooting.current && equippedWeapon) {
            if (state.clock.elapsedTime - lastShootTime.current > equippedWeapon.stats.fireRate) {
                shoot();
                lastShootTime.current = state.clock.elapsedTime;
            }
        }

        if (!body.current || !mesh.current) return;

        // --- Movement (WASD) ---
        const speed = 10;
        const direction = new Vector3();

        // Get camera forward direction (projected to XZ plane)
        const camForward = new Vector3();
        camera.getWorldDirection(camForward);
        camForward.y = 0;
        camForward.normalize();

        const camRight = new Vector3();
        camRight.crossVectors(camForward, new Vector3(0, 1, 0));

        if (keys.current['w']) direction.add(camForward);
        if (keys.current['s']) direction.sub(camForward);
        if (keys.current['a']) direction.sub(camRight);
        if (keys.current['d']) direction.add(camRight);

        if (direction.length() > 0) {
            direction.normalize().multiplyScalar(speed);
        }

        // Set linear velocity directly for responsive movement
        // Refactored to applyImpulse for physics consistency
        if (direction.length() > 0) {
            // Impulse-based movement
            const force = 60; // Needs to be high enough to overcome damping/friction quickly
            const impulse = direction.clone().normalize().multiplyScalar(force * 0.016); // Scale by approx frame time or just force
            // Actually applyImpulse is instant force (N*s), so per frame it acts like acceleration
            const frameImpulse = direction.clone().normalize().multiplyScalar(2); // Tune this value
            body.current.applyImpulse({ x: frameImpulse.x, y: 0, z: frameImpulse.z }, true);
        }

        // We rely on linearDamping to stop the player
    });

    return (
        <>
            <RigidBody
                ref={body}
                position={[0, 1, 0]}
                enabledRotations={[false, false, false]} // Lock rotation so it doesn't roll
                colliders="ball"
                friction={1}
                linearDamping={10} // Stops creating slippery movement
                userData={{ type: 'player' }}
            >
                <mesh ref={mesh} name="player" castShadow receiveShadow>
                    <sphereGeometry args={[0.7, 32, 32]} />
                    <meshStandardMaterial color="cyan" />
                    {/* Direction Indicator */}
                    <mesh position={[0, 0, 0.8]}>
                        <boxGeometry args={[0.2, 0.2, 0.5]} />
                        <meshStandardMaterial color="white" />
                    </mesh>
                </mesh>

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
