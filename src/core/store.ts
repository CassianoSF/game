import { create } from 'zustand';
import { GameRules } from '../systems/gameRules';
import { WEAPONS, type Weapon } from './config/WeaponConfig';
import { moveItem, addToInventory as addToInventoryUtil } from './inventory/InventoryManager';
import type { ProjectileCreationData, EnemyCreationData, ObstacleCreationData } from './config/types';

export interface ProjectileData extends ProjectileCreationData {
  id: string;
}

export type EnemyData = EnemyCreationData;
export type ObstacleData = ObstacleCreationData;

interface GameState {
    score: number;
    projectiles: Record<string, ProjectileData>;
    enemies: Record<string, EnemyData>;
    obstacles: Record<string, ObstacleData>;
    isCameraDragging: boolean;
    stunnedEnemies: Record<string, number>;

    // Game State
    gameState: 'menu' | 'playing' | 'paused';
    setGameState: (state: 'menu' | 'playing' | 'paused') => void;
    togglePause: () => void;

    // Player HP
    playerHp: number;
    maxPlayerHp: number;
    isPlayerDead: boolean;

    // Stamina
    stamina: number;
    maxStamina: number;
    setStamina: (value: number) => void;

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
    damagePlayer: (amount: number) => void;
    resetPlayer: () => void;

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

    // Game State
    gameState: 'menu',

    // Player HP
    playerHp: 100,
    maxPlayerHp: 100,
    isPlayerDead: false,

    // Stamina
    stamina: 100,
    maxStamina: 100,

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
    damagePlayer: (amount) => set((state) => {
        if (state.isPlayerDead) return {};
        const newHp = Math.max(0, state.playerHp - amount);
        return { playerHp: newHp, isPlayerDead: newHp <= 0 };
    }),
    resetPlayer: () => set({ playerHp: 100, isPlayerDead: false, stamina: 100 }),
    setStamina: (value) => set({ stamina: Math.max(0, Math.min(100, value)) }),

    setGameState: (state) => set({ gameState: state }),
    togglePause: () => set((state) => {
        const newState = state.gameState === 'paused' ? 'playing' : 'paused';
        console.log('[Store] togglePause called, current:', state.gameState, 'new:', newState);
        return { gameState: newState };
    }),

    addToInventory: (weapon) => set((state) => ({
        inventory: addToInventoryUtil(state.inventory, weapon)
    })),

    setActiveSlot: (slot) => set({ activeSlot: slot }),

    moveItem: (fromContainer, fromSlot, toContainer, toSlot) => set((state) => {
        const { nextInventory, nextHotbar } = moveItem(
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
