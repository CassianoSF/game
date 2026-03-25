import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Vector3, Raycaster, Plane, Quaternion, MathUtils } from 'three';
import { useStore } from '../../core/store';
import { RapierRigidBody } from '@react-three/rapier';
import { audioAPI } from '../../systems/AudioManager';
import { particleAPI } from '../../systems/ParticleSystem';
import type { BonecoRef } from './BonecoCompleto';

export const usePlayerController = (
    bodyRef: React.RefObject<RapierRigidBody | null>,
    meshRef: React.RefObject<THREE.Group | THREE.Mesh | null>,
    characterRef: React.RefObject<BonecoRef | null>
) => {
    const activeSlot = useStore((state) => state.activeSlot);
    const hotbar = useStore((state) => state.hotbar);
    const addProjectile = useStore((state) => state.addProjectile);
    const isCameraDragging = useStore((state) => state.isCameraDragging);
    const isPlayerDead = useStore((state) => state.isPlayerDead);
    const equippedWeapon = hotbar[activeSlot];
    const { camera, pointer } = useThree();

    // Stamina (managed as a ref for per-frame mutation, synced to store for UI)
    const stamina = useRef(100);
    const lastSyncedStamina = useRef(100); // throttle store writes
    const STAMINA_MAX = 100;
    const STAMINA_REGEN = 15;  // per second (walk / crouch)
    const STAMINA_DRAIN_RUN = 8;   // per second
    const STAMINA_DRAIN_SPR = 20;  // per second
    const STAMINA_COST_ROLL = 30;  // flat cost on roll start
    const STAMINA_REGEN_DELAY = 2; // seconds delay before regen starts when empty

    // Controllers
    const keys = useRef<{ [key: string]: boolean }>({});
    const isShooting = useRef(false);
    const lastShootTime = useRef(0);
    const lastFootstepTime = useRef(0);
    const flashStartTime = useRef(0);
    const moveState = useRef<'run' | 'sprint' | 'walk' | 'crouch' | 'roll'>('run');

    // Roll System
    const isRolling = useRef(false);
    const rollStartTime = useRef(0);
    const rollDirection = useRef(new Vector3());

    // Stamina Regen Delay System
    const staminaEmptyTime = useRef<number | null>(null);

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
        // Bloqueia preventivamente o fechamento direto por CTRL+W
        const preventTabClose = (e: BeforeUnloadEvent) => {
            if (keys.current['control']) {
                e.preventDefault();
                e.returnValue = ''; // Força o Chrome a mostrar a janela "Deseja mesmo sair?"
            }
        };
        window.addEventListener('beforeunload', preventTabClose);
        const handleKeyDown = (e: KeyboardEvent) => {
            keys.current[e.key.toLowerCase()] = true;
            if (e.ctrlKey && ['w', 's', 'a', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keys.current[e.key.toLowerCase()] = false;
            if (e.ctrlKey && ['w', 's', 'a', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        };
        const handleMouseDown = async (e: MouseEvent) => {
            if (e.button === 0) isShooting.current = true;

            // First interaction universally fires background music (Browser Policies)
            // audioAPI.playBGM('sounds/theme05.ogg');

            // Ativa o "Modo Gamer" avançado bloqueando as teclas críticas no navegador
            if ('keyboard' in navigator && (navigator as any).keyboard.lock) {
                try {
                    await (navigator as any).keyboard.lock(['ControlLeft', 'ControlRight', 'KeyW']);
                } catch (err) { }
            }
        };
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
        if (!equippedWeapon || !bodyRef.current || !meshRef.current || !characterRef.current) return;

        flashStartTime.current = performance.now();

        const fireDir = new Vector3();
        const quaternion = new Quaternion();

        meshRef.current.getWorldDirection(fireDir);
        meshRef.current.getWorldQuaternion(quaternion);

        const muzzlePos = characterRef.current.getMuzzlePosition();

        if (equippedWeapon.type === 'machine_gun') {
            const rifleSounds = ['sounds/machine_gun/rifle.ogg', 'sounds/machine_gun/rifle2.ogg', 'sounds/machine_gun/rifle3.ogg'];
            const randomSound = rifleSounds[Math.floor(Math.random() * rifleSounds.length)];
            audioAPI.play2D(randomSound, 0.2);
        } else if (equippedWeapon.type === 'shotgun') {
            const shotgunSounds = ['sounds/shotgun/shotgun.ogg', 'sounds/shotgun/shotgun2.ogg', 'sounds/shotgun/shotgun3.ogg'];
            const randomSound = shotgunSounds[Math.floor(Math.random() * shotgunSounds.length)];
            audioAPI.play2D(randomSound, 0.35);
        } else if (equippedWeapon.type === 'pistol') audioAPI.play2D('sounds/pistol_shot.ogg', 0.7);

        // Muzzle flash: hot particle burst at barrel tip
        particleAPI.emit(muzzlePos, 'muzzle', equippedWeapon.type === 'shotgun' ? 20 : 10, { x: fireDir.x, y: 0, z: fireDir.z });

        for (let i = 0; i < equippedWeapon.stats.projectiles; i++) {
            const spreadAngle = (Math.random() - 0.5) * equippedWeapon.stats.spread;
            const spreadDir = fireDir.clone().applyAxisAngle(new Vector3(0, 1, 0), spreadAngle);
            const spreadQuat = quaternion.clone();
            const qSpread = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), spreadAngle);
            spreadQuat.multiply(qSpread);

            const startPos: [number, number, number] = [muzzlePos.x, muzzlePos.y, muzzlePos.z];

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

        // --- 0. Dead Player Freeze ---
        if (isPlayerDead) {
            bodyRef.current.setLinvel({ x: 0, y: bodyRef.current.linvel().y, z: 0 }, true);
            return;
        }

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
        if (isShooting.current && equippedWeapon && !isRolling.current) {
            if (state.clock.elapsedTime - lastShootTime.current > equippedWeapon.stats.fireRate) {
                shoot();
                lastShootTime.current = state.clock.elapsedTime;
            }
        }

        // --- 3. Movement Logic ---
        let speed = 5;
        const currentStamina = stamina.current;
        const hasStamina = currentStamina > 0;

        if (keys.current['control']) {
            speed = 2;
            moveState.current = 'crouch';
        } else if (keys.current['alt'] && !isShooting.current && hasStamina) {
            speed = 7.5;
            moveState.current = 'sprint';
        } else if (keys.current['shift'] && hasStamina) {
            speed = 5.5;
            moveState.current = 'run';
        } else {
            speed = 2.5;
            moveState.current = 'walk';
        }

        // --- Stamina Drain / Regen ---
        let newStamina = currentStamina;
        const now = state.clock.elapsedTime;
        
        if (moveState.current === 'sprint') {
            newStamina -= STAMINA_DRAIN_SPR * delta;
        } else if (moveState.current === 'run') {
            newStamina -= STAMINA_DRAIN_RUN * delta;
        } else {
            // walk / crouch / roll: regen
            // Check if we need to wait for regen delay
            const canRegen = staminaEmptyTime.current === null || 
                           (now - staminaEmptyTime.current) >= STAMINA_REGEN_DELAY;
            if (canRegen) {
                newStamina += STAMINA_REGEN * delta;
            }
        }
        stamina.current = Math.min(STAMINA_MAX, Math.max(0, newStamina));
        
        // Track when stamina hits 0 for regen delay
        if (stamina.current === 0 && currentStamina > 0) {
            staminaEmptyTime.current = now;
        } else if (stamina.current > 0) {
            staminaEmptyTime.current = null;
        }
        // Only write to store when the displayed integer value changes (throttle re-renders)
        const rounded = Math.floor(stamina.current);
        if (rounded !== lastSyncedStamina.current) {
            lastSyncedStamina.current = rounded;
            useStore.getState().setStamina(stamina.current);
        }

        direction.set(0, 0, 0);

        camera.getWorldDirection(camForward);
        tempForward.copy(camForward).setY(0).normalize();
        camRight.crossVectors(tempForward, globalUp);

        if (keys.current['w']) direction.add(tempForward);
        if (keys.current['s']) direction.sub(tempForward);
        if (keys.current['a']) direction.sub(camRight);
        if (keys.current['d']) direction.add(camRight);

        // --- 4. Roll Override ---
        const ROLL_DURATION = 0.5;
        const ROLL_SPEED = 9;

        if (keys.current[' '] && !isRolling.current && moveState.current !== 'crouch' && stamina.current >= STAMINA_COST_ROLL) {
            isRolling.current = true;
            rollStartTime.current = state.clock.elapsedTime;
            stamina.current = Math.max(0, stamina.current - STAMINA_COST_ROLL);
            useStore.getState().setStamina(stamina.current);

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

        // --- 6. Footsteps Logic ---
        const isMoving = direction.length() > 0.1;

        if (isMoving) {
            let footstepInterval: number;

            switch (moveState.current) {
                case 'crouch':
                    footstepInterval = 0.6;
                    break;
                case 'walk':
                    footstepInterval = 0.55;
                    break;
                case 'run':
                    footstepInterval = 0.27;
                    break;
                case 'sprint':
                    footstepInterval = 0.25;
                    break;
                case 'roll':
                    footstepInterval = 0.25;
                    break;
                default:
                    footstepInterval = 0.4;
            }

            if (state.clock.elapsedTime - lastFootstepTime.current > footstepInterval) {
                const footstepSounds = [
                    'sounds/footsteps/Footstep_Dirt_00.mp3',
                    'sounds/footsteps/Footstep_Dirt_01.mp3',
                    'sounds/footsteps/Footstep_Dirt_02.mp3',
                    'sounds/footsteps/Footstep_Dirt_03.mp3',
                    'sounds/footsteps/Footstep_Dirt_04.mp3',
                    'sounds/footsteps/Footstep_Dirt_05.mp3',
                    'sounds/footsteps/Footstep_Dirt_06.mp3',
                    'sounds/footsteps/Footstep_Dirt_07.mp3',
                    'sounds/footsteps/Footstep_Dirt_08.mp3',
                    'sounds/footsteps/Footstep_Dirt_09.mp3'
                ];

                const randomFootstep = footstepSounds[Math.floor(Math.random() * footstepSounds.length)];
                const playerPos = bodyRef.current.translation();
                audioAPI.play3D(randomFootstep, { x: playerPos.x, y: 0, z: playerPos.z }, 10.);

                lastFootstepTime.current = state.clock.elapsedTime;
            }
        }
    });

    return { moveState, isShooting, flashStartTime };
}
