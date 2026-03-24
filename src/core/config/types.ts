import type { Weapon, WeaponStats } from './WeaponConfig';

export type InventorySlot = number;
export type ContainerType = 'inventory' | 'hotbar';

export interface MoveItemParams {
  fromContainer: ContainerType;
  fromSlot: InventorySlot;
  toContainer: ContainerType;
  toSlot: InventorySlot;
}

export interface InventoryMoveResult {
  nextInventory: (Weapon | null)[];
  nextHotbar: (Weapon | null)[];
}

export interface ProjectileCreationData {
  position: [number, number, number];
  direction: [number, number, number];
  rotation: [number, number, number, number];
  stats: WeaponStats;
}

export interface EnemyCreationData {
  id: string;
  position: [number, number, number];
  hp: number;
  isDead?: boolean;
  modelPath?: string;
}

export interface ObstacleCreationData {
  id: string;
  position: [number, number, number];
  scale?: [number, number, number];
}
