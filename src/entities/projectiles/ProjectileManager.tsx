import { useMemo } from 'react';
import { useStore } from '../../core/store';
import { Projectile } from './Projectile';

export function ProjectileManager() {
    const projectiles = useStore((state) => state.projectiles);
    const projectileList = useMemo(() => Object.values(projectiles), [projectiles]);

    return (
        <>
            {projectileList.map((p) => (
                <Projectile key={p.id} data={p} />
            ))}
        </>
    );
}
