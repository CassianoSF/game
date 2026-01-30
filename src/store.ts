import { create } from 'zustand';


export type WeaponStats = {
    damage: number;
    fireRate: number;
    speed: number;
    color: string;
    projectiles: number;
    spread: number;
    knockback: number;
};

export interface Weapon {
    id: string;
    name: string;
    type: 'pistol' | 'machine_gun' | 'shotgun';
    icon: string;
    stats: WeaponStats;
}
// ...
export const WEAPONS: { [key: string]: Weapon } = {
    pistol: {
        id: 'pistol',
        name: 'Pistol',
        icon: '🔫',
        stats: { damage: 25, fireRate: 0.4, speed: 60, color: 'yellow', projectiles: 1, spread: 0, knockback: 5 },
        type: 'pistol'
    },
    machine_gun: {
        id: 'machine_gun',
        name: 'Machine Gun',
        icon: '🔥',
        stats: { damage: 10, fireRate: 0.1, speed: 80, color: 'orange', projectiles: 1, spread: 0.1, knockback: 2 },
        type: 'machine_gun'
    },
    shotgun: {
        id: 'shotgun',
        name: 'Shotgun',
        icon: '💥',
        stats: { damage: 15, fireRate: 1.0, speed: 50, color: 'red', projectiles: 5, spread: 0.3, knockback: 8 },
        type: 'shotgun'
    }
};

export interface ProjectileData {
    id: string;
    position: [number, number, number];
    direction: [number, number, number];
    rotation: [number, number, number, number]; // Quaternion
    stats: Weapon['stats']; // Include weapon stats
}

export interface EnemyData {
    id: string;
    position: [number, number, number];
    hp: number; // Add HP
}

interface GameState {
    score: number;
    projectiles: ProjectileData[];
    enemies: EnemyData[];
    isCameraDragging: boolean;
    stunnedEnemies: Record<string, number>;

    // Inventory
    inventory: (Weapon | null)[];
    hotbar: (Weapon | null)[];
    activeSlot: number;

    increaseScore: () => void;
    addProjectile: (p: ProjectileData) => void;
    removeProjectile: (id: string) => void;
    addEnemy: (e: EnemyData) => void;
    damageEnemy: (id: string, amount: number) => void;
    stunEnemy: (id: string, duration: number) => void;
    setCameraDragging: (isDragging: boolean) => void;

    // Inventory Actions
    addToInventory: (weapon: Weapon) => void; // Finds first empty slot
    setActiveSlot: (slot: number) => void;
    moveItem: (fromContainer: 'inventory' | 'hotbar', fromSlot: number, toContainer: 'inventory' | 'hotbar', toSlot: number) => void;
}

export const useStore = create<GameState>((set) => ({
    score: 0,
    projectiles: [],
    enemies: [],
    stunnedEnemies: {}, // Init empty
    isCameraDragging: false,

    // 20 Inventory Slots
    inventory: Array(20).fill(null),
    // 10 Hotbar Slots
    hotbar: [
        WEAPONS.pistol, WEAPONS.machine_gun, WEAPONS.shotgun,
        ...Array(7).fill(null)
    ],
    activeSlot: 0,

    increaseScore: () => set((state) => ({ score: state.score + 1 })),
    addProjectile: (p) => set((state) => ({ projectiles: [...state.projectiles, p] })),
    removeProjectile: (id) => set((state) => ({ projectiles: state.projectiles.filter((p) => p.id !== id) })),
    addEnemy: (e) => set((state) => ({ enemies: [...state.enemies, e] })),
    removeEnemy: (id) => set((state) => ({ enemies: state.enemies.filter((e) => e.id !== id) })),
    stunEnemy: (id: string, duration: number) => set((state) => ({
        stunnedEnemies: { ...state.stunnedEnemies, [id]: Date.now() + duration }
    })),
    damageEnemy: (id, amount) => set((state) => {
        const newEnemies = state.enemies.map(e => {
            if (e.id === id) {
                return { ...e, hp: e.hp - amount };
            }
            return e;
        }).filter(e => e.hp > 0);

        const countBefore = state.enemies.length;
        const countAfter = newEnemies.length;
        if (countAfter < countBefore) {
            return { enemies: newEnemies, score: state.score + (countBefore - countAfter) };
        }
        return { enemies: newEnemies };
    }),
    setCameraDragging: (isDragging) => set({ isCameraDragging: isDragging }),

    addToInventory: (weapon) => set((state) => {
        const firstEmpty = state.inventory.indexOf(null);
        if (firstEmpty === -1) return state; // Full
        const newInv = [...state.inventory];
        newInv[firstEmpty] = weapon;
        return { inventory: newInv };
    }),

    setActiveSlot: (slot) => set({ activeSlot: slot }),

    moveItem: (fromContainer, fromSlot, toContainer, toSlot) => set((state) => {
        // Create copies
        const newInventory = [...state.inventory];
        const newHotbar = [...state.hotbar];

        const getList = (c: 'inventory' | 'hotbar') => c === 'inventory' ? newInventory : newHotbar;
        const sourceList = getList(fromContainer);
        const targetList = getList(toContainer);

        const itemToMove = sourceList[fromSlot];
        const itemAtTarget = targetList[toSlot];

        // Swap
        sourceList[fromSlot] = itemAtTarget;
        targetList[toSlot] = itemToMove;

        return { inventory: newInventory, hotbar: newHotbar };
    }),
}));
