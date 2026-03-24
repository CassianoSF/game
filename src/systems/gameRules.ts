import type { EnemyData } from '../core/store';

export const GameRules = {
    processHit: (
        enemies: Record<string, EnemyData>,
        stunnedEnemies: Record<string, number>,
        id: string,
        damage: number,
        stunDuration: number
    ): {
        nextEnemies: Record<string, EnemyData>;
        nextStunned: Record<string, number>;
        scoreIncrease: number;
    } => {
        const target = enemies[id];
        if (!target || target.isDead) return { nextEnemies: enemies, nextStunned: stunnedEnemies, scoreIncrease: 0 };

        const newHp = target.hp - damage;

        if (newHp <= 0) {
            const remainingStun = Object.fromEntries(
                Object.entries(stunnedEnemies).filter(([key]) => key !== id)
            );
            return {
                nextEnemies: {
                    ...enemies,
                    [id]: { ...target, hp: 0, isDead: true }
                },
                nextStunned: remainingStun,
                scoreIncrease: 1
            };
        }

        return {
            nextEnemies: {
                ...enemies,
                [id]: { ...target, hp: newHp }
            },
            nextStunned: {
                ...stunnedEnemies,
                [id]: Date.now() + stunDuration
            },
            scoreIncrease: 0
        };
    }
};
