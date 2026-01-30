import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useStore } from '../store';
import { Vector3 } from 'three';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export const Projectile = ({ data }: { data: any }) => {
    const { removeProjectile, damageEnemy, stunEnemy } = useStore();
    const startTime = useRef(Date.now());
    const bodyRef = useRef<RapierRigidBody>(null);

    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.setLinvel({
                x: data.direction[0] * data.stats.speed,
                y: data.direction[1] * data.stats.speed,
                z: data.direction[2] * data.stats.speed
            }, true);
        }
    }, []); // Run ONLY on mount

    // Auto-remove after 2 seconds
    useFrame(() => {
        if (Date.now() - startTime.current > 2000) {
            removeProjectile(data.id);
        }
    });

    const handleCollision = (payload: any) => {
        const otherUserData = payload.other.rigidBody?.userData as any;

        if (otherUserData?.type === 'enemy') {
            damageEnemy(otherUserData.id, data.stats.damage);
            const enemyBody = payload.other.rigidBody;
            if (enemyBody) {
                const impulseDir = new Vector3(...data.direction).normalize();
                const impulseStrength = data.stats.knockback || 2;
                const impulse = impulseDir.multiplyScalar(impulseStrength);
                enemyBody.applyImpulse({ x: impulse.x, y: 0, z: impulse.z }, true);
                stunEnemy(otherUserData.id, 300);
            }
            // removeProjectile(data.id); // Piercing
        }
        // Walls/Obstacles: Physics engine handles bounce automatically via restitution
    };

    return (
        <RigidBody
            ref={bodyRef}
            position={data.position}
            // Removed linearVelocity prop to prevent reset on re-render
            gravityScale={0}
            restitution={0} // No bounce
            friction={1}    // Max friction
            angularDamping={1} // Stop rolling
            linearDamping={0.5} // Air resistance (slows down over time too, ensures it stops)
            ccd={true}
            onCollisionEnter={handleCollision}
            userData={{ type: 'projectile', id: data.id }}
            enabledTranslations={[true, false, true]} // Keep on Y plane
        >
            <mesh>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color={data.stats.color} emissive={data.stats.color} emissiveIntensity={2} />
            </mesh>
        </RigidBody>
    );
};
