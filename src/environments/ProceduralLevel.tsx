import { useEffect, useMemo } from 'react';
import { useStore } from '../core/store';
import { Enemy } from '../entities/enemies/Enemy';
import { Obstacle } from './Obstacle';

export function ProceduralLevel() {
    const enemies = useStore((state) => state.enemies);
    const obstacles = useStore((state) => state.obstacles);
    const enemyList = useMemo(() => Object.values(enemies), [enemies]);
    const obstacleList = useMemo(() => Object.values(obstacles), [obstacles]);
    const addEnemy = useStore((state) => state.addEnemy);
    const resetLevel = useStore((state) => state.resetLevel);

    useEffect(() => {
        resetLevel();
        addEnemy({
            id: crypto.randomUUID(),
            position: [5, 1, 5],
            hp: 100
        });
        useStore.getState().addObstacle({
            id: crypto.randomUUID(),
            position: [0, 2, -5],
        });
    }, [addEnemy, resetLevel]);

    return (
        <>
            {obstacleList.map((o) => (
                <Obstacle key={o.id} data={o} />
            ))}
            {enemyList.map(e => (
                <Enemy key={e.id} data={e} />
            ))}
        </>
    )
}
