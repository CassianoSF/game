import type { Entity } from './types';
import type { World } from './World';

export interface EntitySystem {
  name: string;
  priority: number;
  requiredComponents: string[];
  update: (entities: Entity[], deltaTime: number, world: World) => void;
  enabled?: boolean;
}

export const SYSTEM_PRIORITY = {
  INPUT: 100,
  AI: 90,
  MOVEMENT: 80,
  PHYSICS: 70,
  COMBAT: 60,
  ANIMATION: 50,
  RENDERING: 40,
  PARTICLES: 30,
  CLEANUP: 10,
} as const;

export interface SystemStats {
  name: string;
  entitiesProcessed: number;
  executionTime: number;
}
