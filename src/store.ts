import { create } from 'zustand';
import { GameRules } from './logic/gameRules';


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
    isDead?: boolean;
}

export interface ObstacleData {
    id: string;
    position: [number, number, number];
    scale?: [number, number, number];
}

interface GameState {
    score: number;
    projectiles: Record<string, ProjectileData>;
    enemies: Record<string, EnemyData>;
    obstacles: Record<string, ObstacleData>;
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
    removeEnemy: (id: string) => void;
    addObstacle: (o: ObstacleData) => void;
    removeObstacle: (id: string) => void;
    hitEnemy: (id: string, damage: number, stunDuration: number) => void;
    setCameraDragging: (isDragging: boolean) => void;

    // Level Management
    currentLevel: 'procedural' | 'simple';
    setLevel: (level: 'procedural' | 'simple') => void;
    resetLevel: () => void;

    // Inventory Actions
    addToInventory: (weapon: Weapon) => void; // Finds first empty slot
    setActiveSlot: (slot: number) => void;
    moveItem: (fromContainer: 'inventory' | 'hotbar', fromSlot: number, toContainer: 'inventory' | 'hotbar', toSlot: number) => void;
}


export const useStore = create<GameState>((set) => ({
    score: 0,
    projectiles: {},
    enemies: {},
    obstacles: {},
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

    currentLevel: 'procedural',

    setLevel: (level) => set({ currentLevel: level }),
    resetLevel: () => set({ enemies: {}, obstacles: {}, projectiles: {}, stunnedEnemies: {} }),

    increaseScore: () => set((state) => ({ score: state.score + 1 })),
    addProjectile: (p) => set((state) => ({ projectiles: { ...state.projectiles, [p.id]: p } })),
    removeProjectile: (id: string) => set((state) => {
        const remaining = Object.fromEntries(
            Object.entries(state.projectiles).filter(([key]) => key !== id)
        );
        return { projectiles: remaining };
    }),
    addEnemy: (e) => set((state) => ({ enemies: { ...state.enemies, [e.id]: e } })),
    removeEnemy: (id: string) => set((state) => {
        const remaining = Object.fromEntries(
            Object.entries(state.enemies).filter(([key]) => key !== id)
        );
        return { enemies: remaining };
    }),
    addObstacle: (o) => set((state) => ({ obstacles: { ...state.obstacles, [o.id]: o } })),
    removeObstacle: (id: string) => set((state) => {
        const remaining = Object.fromEntries(
            Object.entries(state.obstacles).filter(([key]) => key !== id)
        );
        return { obstacles: remaining };
    }),
    hitEnemy: (id, damage, stunDuration) => set((state) => {
        const { nextEnemies, nextStunned, scoreIncrease } = GameRules.processHit(
            state.enemies,
            state.stunnedEnemies,
            id,
            damage,
            stunDuration
        );

        if (scoreIncrease > 0) {
            return { enemies: nextEnemies, stunnedEnemies: nextStunned, score: state.score + scoreIncrease };
        }
        return { enemies: nextEnemies, stunnedEnemies: nextStunned };
    }),
    setCameraDragging: (isDragging) => set({ isCameraDragging: isDragging }),


    addToInventory: (weapon) => set((state) => ({
        inventory: GameRules.addToInventory(state.inventory, weapon)
    })),

    setActiveSlot: (slot) => set({ activeSlot: slot }),

    moveItem: (fromContainer, fromSlot, toContainer, toSlot) => set((state) => {
        const { nextInventory, nextHotbar } = GameRules.moveItem(
            state.inventory,
            state.hotbar,
            fromContainer,
            fromSlot,
            toContainer,
            toSlot
        );
        return { inventory: nextInventory, hotbar: nextHotbar };
    }),
}));
