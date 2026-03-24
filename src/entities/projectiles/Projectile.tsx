import { RigidBody, RapierRigidBody, interactionGroups } from '@react-three/rapier';
import { useStore } from '../../core/store';
import { Vector3 } from 'three';
import { useRef, useEffect, memo, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { particleAPI } from '../../systems/ParticleSystem';
import { audioAPI } from '../../systems/AudioManager';


export const Projectile = memo(({ data }: { data: any }) => {
    const { removeProjectile, hitEnemy } = useStore();
    const startTime = useRef(0);
    const bodyRef = useRef<RapierRigidBody>(null);
    const hitTargets = useRef<Set<string>>(new Set());
    const impulseDir = useMemo(() => new Vector3(), []);

    useEffect(() => {
        startTime.current = Date.now();
        if (bodyRef.current) {
            bodyRef.current.setLinvel({
                x: data.direction[0] * data.stats.speed,
                y: data.direction[1] * data.stats.speed,
                z: data.direction[2] * data.stats.speed
            }, true);
        }
    }, [data.direction, data.stats.speed]);

    useFrame(() => {
        if (Date.now() - startTime.current > 1000) {
            removeProjectile(data.id);
        }
    });

    const handleCollision = (payload: any) => {
        const otherUserData = payload.other.rigidBody?.userData as any;

        if (otherUserData?.type === 'enemy' || otherUserData?.type === 'obstacle') {
            const isEnemy = otherUserData.type === 'enemy';
            const entityId = otherUserData.id;

            if (hitTargets.current.has(entityId)) return;
            hitTargets.current.add(entityId);

            if (isEnemy) {
                hitEnemy(entityId, data.stats.damage, 300);
                const pos = bodyRef.current?.translation() as any || { x: data.position[0], y: data.position[1], z: data.position[2] };
                particleAPI.emit(pos, 'blood', 15);
                const rndHit = Math.floor(Math.random() * 4); // 0 to 3
                audioAPI.play3D(`sounds/zombie_hit/${rndHit}.wav`, pos, 20.0);
            } else {
                particleAPI.emit(bodyRef.current?.translation() as any || { x: data.position[0], y: data.position[1], z: data.position[2] }, 'spark', 15);
            }

            const hitBody = payload.other.rigidBody;
            if (hitBody) {
                impulseDir.set(data.direction[0], data.direction[1], data.direction[2]).normalize();
                const impulseStrength = (data.stats.knockback || 2) * 3;
                const impulse = impulseDir.multiplyScalar(impulseStrength);
                hitBody.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);
            }
        }

        // Destroy the projectile immediately upon hitting ANY physical object (Floor, Wall, Enemy)
        removeProjectile(data.id);
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
                    <meshBasicMaterial color={data.stats.color} toneMapped={false} />
                </mesh>
            </group>
        </RigidBody>
    );
});
