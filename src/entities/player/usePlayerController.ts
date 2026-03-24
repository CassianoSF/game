import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3, Raycaster, Plane, Quaternion, MathUtils } from 'three';
import { useStore } from '../../core/store';
import { RapierRigidBody } from '@react-three/rapier';

export function usePlayerController(
    bodyRef: React.RefObject<RapierRigidBody | null>,
    meshRef: React.RefObject<THREE.Group | THREE.Mesh | null>
) {
    const activeSlot = useStore((state) => state.activeSlot);
    const hotbar = useStore((state) => state.hotbar);
    const addProjectile = useStore((state) => state.addProjectile);
    const isCameraDragging = useStore((state) => state.isCameraDragging);
    const equippedWeapon = hotbar[activeSlot];
    const { camera, pointer } = useThree();

    // Controllers
    const keys = useRef<{ [key: string]: boolean }>({});
    const isShooting = useRef(false);
    const lastShootTime = useRef(0);
    const moveState = useRef<'run' | 'sprint' | 'walk' | 'crouch' | 'roll'>('run');
    
    // Roll System
    const isRolling = useRef(false);
    const rollStartTime = useRef(0);
    const rollDirection = useRef(new Vector3());

    // Aim System
    const lockedPointer = useRef(new Vector3());
    const raycaster = useMemo(() => new Raycaster(), []);
    const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

    // Vector Caching (Performance)
    const camForward = useMemo(() => new Vector3(), []);
    const camRight = useMemo(() => new Vector3(), []);
    const direction = useMemo(() => new Vector3(), []);
    const tempForward = useMemo(() => new Vector3(), []);
    const globalUp = useMemo(() => new Vector3(0, 1, 0), []);
    const aimTarget = useMemo(() => new Vector3(), []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
        const handleKeyUp = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
        const handleMouseDown = (e: MouseEvent) => { if (e.button === 0) isShooting.current = true; };
        const handleMouseUp = (e: MouseEvent) => { if (e.button === 0) isShooting.current = false; };

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
        if (!equippedWeapon || !bodyRef.current || !meshRef.current) return;

        const position = bodyRef.current.translation();
        const fireDir = new Vector3();
        const quaternion = new Quaternion();
        
        meshRef.current.getWorldDirection(fireDir);
        meshRef.current.getWorldQuaternion(quaternion);

        const offset = 0.4;

        for (let i = 0; i < equippedWeapon.stats.projectiles; i++) {
            const spreadAngle = (Math.random() - 0.5) * equippedWeapon.stats.spread;
            const spreadDir = fireDir.clone().applyAxisAngle(new Vector3(0, 1, 0), spreadAngle);
            const spreadQuat = quaternion.clone();
            const qSpread = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), spreadAngle);
            spreadQuat.multiply(qSpread);

            const startPos: [number, number, number] = [
                position.x + fireDir.x * offset,
                position.y + 0.35,
                position.z + fireDir.z * offset
            ];

            addProjectile({
                id: crypto.randomUUID(),
                position: startPos,
                direction: [spreadDir.x, spreadDir.y, spreadDir.z],
                rotation: [spreadQuat.x, spreadQuat.y, spreadQuat.z, spreadQuat.w],
                stats: equippedWeapon.stats
            });
        }
    };

    useFrame((state, delta) => {
        if (!bodyRef.current || !meshRef.current) return;

        // --- 1. Aim Logic ---
        if (!isRolling.current) {
            if (!isCameraDragging) {
                lockedPointer.current.set(pointer.x, pointer.y, 0);
            }
            raycaster.setFromCamera({ x: lockedPointer.current.x, y: lockedPointer.current.y } as any, camera);
            raycaster.ray.intersectPlane(plane, aimTarget);

            if (aimTarget) {
                const playerPos = bodyRef.current.translation();
                meshRef.current.lookAt(aimTarget.x, playerPos.y, aimTarget.z);
            }
        }

        // --- 2. Shooting Logic ---
        if (isShooting.current && equippedWeapon) {
            if (state.clock.elapsedTime - lastShootTime.current > equippedWeapon.stats.fireRate) {
                shoot();
                lastShootTime.current = state.clock.elapsedTime;
            }
        }

        // --- 3. Movement Logic ---
        let speed = 5;

        if (keys.current['control']) {
            speed = 2;
            moveState.current = 'crouch';
        } else if (keys.current['alt']) {
            speed = 2.5;
            moveState.current = 'walk';
        } else if (keys.current['shift']) {
            speed = 8;
            moveState.current = 'sprint';
        } else {
            speed = 5;
            moveState.current = 'run';
        }

        direction.set(0, 0, 0);

        camera.getWorldDirection(camForward);
        tempForward.copy(camForward);
        tempForward.y = 0;
        tempForward.normalize();
        camRight.crossVectors(tempForward, globalUp);

        if (keys.current['w']) direction.add(tempForward);
        if (keys.current['s']) direction.sub(tempForward);
        if (keys.current['a']) direction.sub(camRight);
        if (keys.current['d']) direction.add(camRight);

        // --- 4. Roll Override ---
        const ROLL_DURATION = 0.5;
        const ROLL_SPEED = 9;

        if (keys.current[' '] && !isRolling.current && moveState.current !== 'crouch') {
            isRolling.current = true;
            rollStartTime.current = state.clock.elapsedTime;

            if (direction.length() > 0) {
                rollDirection.current.copy(direction).normalize();
            } else {
                rollDirection.current.copy(tempForward).normalize();
            }
        }

        if (isRolling.current) {
            if (state.clock.elapsedTime - rollStartTime.current > ROLL_DURATION) {
                isRolling.current = false;
            } else {
                moveState.current = 'roll';
                speed = ROLL_SPEED;

                direction.copy(rollDirection.current).multiplyScalar(speed);

                const playerPos = bodyRef.current.translation();
                meshRef.current.lookAt(playerPos.x + direction.x, playerPos.y, playerPos.z + direction.z);
            }
        } else if (direction.length() > 0) {
            direction.normalize().multiplyScalar(speed);
        }

        // --- 5. Velocity Lerp Execution ---
        const currentVel = bodyRef.current.linvel();
        const lerpFactor = 10 * delta;
        const newX = MathUtils.lerp(currentVel.x, direction.x, lerpFactor);
        const newZ = MathUtils.lerp(currentVel.z, direction.z, lerpFactor);

        bodyRef.current.setLinvel({ x: newX, y: currentVel.y, z: newZ }, true);
    });

    return { moveState, isShooting };
}
