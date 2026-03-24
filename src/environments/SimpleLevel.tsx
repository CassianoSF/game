import { RigidBody } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import { useStore } from '../core/store';
import { Enemy } from '../entities/enemies/Enemy';
import { Obstacle } from './Obstacle';

export function SimpleLevel() {
    const enemies = useStore((state) => state.enemies);
    const obstacles = useStore((state) => state.obstacles);
    const enemyList = useMemo(() => Object.values(enemies), [enemies]);
    const obstacleList = useMemo(() => Object.values(obstacles), [obstacles]);
    const addEnemy = useStore((state) => state.addEnemy);
    const resetLevel = useStore((state) => state.resetLevel);

    useEffect(() => {
        resetLevel();

        addEnemy({
            id: 'duel-enemy',
            position: [0, 1, -10],
            hp: 100
        });

        useStore.getState().addObstacle({
            id: 'duel-obstacle',
            position: [0, 2, 0],
        });
    }, [resetLevel, addEnemy]);

    return (
        <>
            <RigidBody type="fixed" colliders="cuboid" friction={1}>
                <mesh position={[0, 2, -20]} receiveShadow>
                    <boxGeometry args={[40, 4, 1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[0, 2, 20]} receiveShadow>
                    <boxGeometry args={[40, 4, 1]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[20, 2, 0]} receiveShadow>
                    <boxGeometry args={[1, 4, 40]} />
                    <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[-20, 2, 0]} receiveShadow>
                     <boxGeometry args={[1, 4, 40]} />
                     <meshStandardMaterial color="#555" />
                </mesh>
            </RigidBody>

            {obstacleList.map(o => (
                <Obstacle key={o.id} data={o} />
            ))}
            {enemyList.map(e => (
                <Enemy key={e.id} data={e} />
            ))}
        </>
    )
}
