import { RigidBody, RapierRigidBody, interactionGroups, useRapier } from '@react-three/rapier';
import { useStore } from '../../core/store';
import { Vector3 } from 'three';
import { useRef, useEffect, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { particleAPI } from '../../systems/ParticleSystem';
import { audioAPI } from '../../systems/AudioManager';
import type { ProjectileData } from '../../core/store';
import { useIsPaused } from '../../core/pause';

interface EntityUserData {
  type: string;
  id: string;
}


export const Projectile = memo(({ data }: { data: ProjectileData }) => {
    const { world } = useRapier();
    const startTime = useRef(0);
    const bodyRef = useRef<RapierRigidBody>(null);
    const hitTargets = useRef<Set<string>>(new Set());
    const impulseDir = useMemo(() => new Vector3(), []);
    const previousPos = useRef(new Vector3(data.position[0], data.position[1], data.position[2]));
    const lastHitTime = useRef(0);
    const processedHits = useRef<Set<number>>(new Set());

    useEffect(() => {
        startTime.current = Date.now();
        previousPos.current.set(data.position[0], data.position[1], data.position[2]);
        lastHitTime.current = 0;
        processedHits.current.clear();
        if (bodyRef.current) {
            bodyRef.current.setLinvel({
                x: data.direction[0] * data.stats.speed,
                y: data.direction[1] * data.stats.speed,
                z: data.direction[2] * data.stats.speed
            }, true);
        }
    }, [data.direction, data.stats.speed]);

    const processHit = (hitBody: { userData?: unknown; applyImpulse: (impulse: { x: number; y: number; z: number }, wakeUp: boolean) => void }, hitPoint: Vector3) => {
        const userData = hitBody.userData as EntityUserData | undefined;
        if (!userData || (userData.type !== 'enemy' && userData.type !== 'obstacle')) return false;

        const entityId = userData.id;

        if (hitTargets.current.has(entityId)) return false;
        hitTargets.current.add(entityId);

        const isEnemy = userData.type === 'enemy';

        if (isEnemy) {
            useStore.getState().hitEnemy(entityId, data.stats.damage, 300);
            particleAPI.emit({ x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }, 'blood', 35, { x: data.direction[0], y: data.direction[1], z: data.direction[2] });
            const rndHit = Math.floor(Math.random() * 4);
            audioAPI.play3D(`sounds/zombie_hit/${rndHit}.wav`, { x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }, 20.0);
        } else {
            particleAPI.emit({ x: hitPoint.x, y: hitPoint.y, z: hitPoint.z }, 'spark', 15);
        }

        if (hitBody) {
            impulseDir.set(data.direction[0], data.direction[1], data.direction[2]).normalize();
            const impulseStrength = (data.stats.knockback || 2) * 3;
            const impulse = impulseDir.multiplyScalar(impulseStrength);
            hitBody.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);
        }

        return true;
    };

    const isPaused = useIsPaused();

    useFrame(() => {
        const now = Date.now();

        if (isPaused.current) return;

        if (now - startTime.current > 1000) {
            useStore.getState().removeProjectile(data.id);
            return;
        }

        if (!world || !bodyRef.current) return;

        const currentPos = bodyRef.current.translation();
        const currentVec = new Vector3(currentPos.x, currentPos.y, currentPos.z);

        const direction = new Vector3().subVectors(currentVec, previousPos.current);
        const distance = direction.length();

        if (distance < 0.01) {
            previousPos.current.copy(currentVec);
            return;
        }

        direction.normalize();

        const rayOrigin = previousPos.current.clone();
        const maxToi = Math.max(1, distance);

        const ray = {
            origin: rayOrigin,
            dir: direction
        };

        try {
            const hit = (world as any).castRay(
                ray,
                maxToi,
                true,
                undefined,
                undefined,
                interactionGroups(2, [0, 1])
            );

            if (hit && hit.collider && !processedHits.current.has(hit.collider.handle)) {
                processedHits.current.add(hit.collider.handle);

                const hitCollider = hit.collider;
                const hitParent = hitCollider.parent();
                const hitBody = hitParent?.handle ? (world as any).getRigidBody(hitParent.handle) : null;

                if (hitBody) {
                    const toi = (hit as any).toi !== undefined ? (hit as any).toi : maxToi;
                    const hitPoint = rayOrigin.clone().add(direction.clone().multiplyScalar(toi));

                    if (processHit(hitBody, hitPoint)) {
                        lastHitTime.current = now;
                        useStore.getState().removeProjectile(data.id);
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('Raycast error:', e);
        }

        previousPos.current.copy(currentVec);
    });

    const handleCollision = (payload: unknown) => {
        const p = payload as { other: { rigidBody?: { userData?: EntityUserData; applyImpulse: (impulse: { x: number; y: number; z: number }, wakeUp: boolean) => void } } };
        const otherUserData = p.other.rigidBody?.userData;

        if (otherUserData?.type === 'enemy' || otherUserData?.type === 'obstacle') {
            const isEnemy = otherUserData.type === 'enemy';
            const entityId = otherUserData.id;

            if (hitTargets.current.has(entityId)) return;
            hitTargets.current.add(entityId);

            if (isEnemy) {
                useStore.getState().hitEnemy(entityId, data.stats.damage, 300);
                const pos = bodyRef.current?.translation() as any || { x: data.position[0], y: data.position[1], z: data.position[2] };
                particleAPI.emit(pos, 'blood', 35, { x: data.direction[0], y: data.direction[1], z: data.direction[2] });
                const rndHit = Math.floor(Math.random() * 4); // 0 to 3
                audioAPI.play3D(`sounds/zombie_hit/${rndHit}.wav`, pos, 20.0);
            } else {
                particleAPI.emit(bodyRef.current?.translation() as any || { x: data.position[0], y: data.position[1], z: data.position[2] }, 'spark', 15);
            }

            const hitBody = p.other.rigidBody;
            if (hitBody) {
                impulseDir.set(data.direction[0], data.direction[1], data.direction[2]).normalize();
                const impulseStrength = (data.stats.knockback || 2) * 3;
                const impulse = impulseDir.multiplyScalar(impulseStrength);
                hitBody.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);
            }
        }

        // Destroy the projectile immediately upon hitting ANY physical object (Floor, Wall, Enemy)
        useStore.getState().removeProjectile(data.id);
    };

    return (
        <RigidBody
            ref={bodyRef}
            position={data.position}
            gravityScale={1}
            restitution={0}
            friction={1}
            angularDamping={1}
            linearDamping={0.5}
            ccd={true}
            collisionGroups={interactionGroups(2, [0, 1])}
            onCollisionEnter={handleCollision}
            userData={{ type: 'projectile', id: data.id }}
            enabledTranslations={[true, true, true]}
        >
            <group quaternion={data.rotation}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
                    <meshBasicMaterial color="#ffffcc" toneMapped={false} />
                </mesh>
            </group>
        </RigidBody>
    );
});
