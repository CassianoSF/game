import type { EnemyData, Weapon } from '../store';

export const GameRules = {
    /**
     * Processes damage to an enemy and calculates score increase if killed.
     */
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

        // Update enemy
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
    },

    /**
     * Handles inventory item movement/swapping.
     */
    moveItem: (
        inventory: (Weapon | null)[],
        hotbar: (Weapon | null)[],
        fromContainer: 'inventory' | 'hotbar',
        fromSlot: number,
        toContainer: 'inventory' | 'hotbar',
        toSlot: number
    ): { nextInventory: (Weapon | null)[]; nextHotbar: (Weapon | null)[] } => {
        const nextInventory = [...inventory];
        const nextHotbar = [...hotbar];

        const getList = (c: 'inventory' | 'hotbar') => (c === 'inventory' ? nextInventory : nextHotbar);
        const sourceList = getList(fromContainer);
        const targetList = getList(toContainer);

        const itemToMove = sourceList[fromSlot];
        const itemAtTarget = targetList[toSlot];

        // Swap
        sourceList[fromSlot] = itemAtTarget;
        targetList[toSlot] = itemToMove;

        return { nextInventory, nextHotbar };
    },

    /**
     * Adds an item to the first empty slot in the inventory.
     */
    addToInventory: (
        inventory: (Weapon | null)[],
        weapon: Weapon
    ): (Weapon | null)[] => {
        const firstEmpty = inventory.indexOf(null);
        if (firstEmpty === -1) return inventory; // Full

        const nextInventory = [...inventory];
        nextInventory[firstEmpty] = weapon;
        return nextInventory;
    }
};
