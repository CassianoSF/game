import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { memo, useRef } from 'react';
import type { ObstacleData } from '../core/store';

export const Obstacle = memo(({ data }: { data: ObstacleData }) => {
    const bodyRef = useRef<RapierRigidBody>(null);
    const scale = data.scale || [1, 1, 1];

    return (
        <RigidBody
            ref={bodyRef}
            position={data.position}
            colliders="cuboid"
            friction={1}
            restitution={0}
            type="dynamic"
            density={10}
            linearDamping={1}
            angularDamping={1}
            userData={{ type: 'obstacle', id: data.id }}
        >
            <mesh castShadow receiveShadow scale={scale}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="#888" />
            </mesh>
        </RigidBody>
    );
});
