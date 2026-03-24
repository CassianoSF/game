import type { Component } from './types';

export const COMPONENT_TYPES = {
  TRANSFORM: 'transform',
  VELOCITY: 'velocity',
  ROTATION: 'rotation',
  PHYSICS: 'physics',
  MESH: 'mesh',
  HEALTH: 'health',
  WEAPON: 'weapon',
  INVENTORY: 'inventory',
  AI: 'ai',
  STATS: 'stats',
  PLAYER: 'player',
  ENEMY: 'enemy',
  PROJECTILE: 'projectile',
  PARTICLE: 'particle',
  OBSTACLE: 'obstacle',
} as const;

export type ComponentTypeValue = typeof COMPONENT_TYPES[keyof typeof COMPONENT_TYPES];

export interface TransformComponent extends Component {
  type: ComponentTypeValue;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface VelocityComponent extends Component {
  type: ComponentTypeValue;
  velocity: [number, number, number];
  angularVelocity?: [number, number, number];
}

export interface PhysicsComponent extends Component {
  type: ComponentTypeValue;
  mass: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
  enabledAxes: [boolean, boolean, boolean];
  gravityScale: number;
}

export interface MeshComponent extends Component {
  type: ComponentTypeValue;
  geometry?: string;
  material?: string;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
}

export interface HealthComponent extends Component {
  type: ComponentTypeValue;
  current: number;
  max: number;
  isDead: boolean;
  invincibleUntil?: number;
}

export interface WeaponComponent extends Component {
  type: ComponentTypeValue;
  weaponId: string;
  lastFireTime: number;
  currentAmmo: number;
  maxAmmo: number;
  reloading: boolean;
  reloadTime: number;
}

export interface AIComponent extends Component {
  type: ComponentTypeValue;
  state: string;
  targetEntity?: number;
  lastKnownPlayerPosition?: [number, number, number];
  memoryDuration: number;
  aggroRange: number;
  loseSightRange: number;
}

export interface StatsComponent extends Component {
  type: ComponentTypeValue;
  moveSpeed: number;
  sprintMultiplier: number;
  jumpForce: number;
  stamina: number;
  maxStamina: number;
  staminaRegenRate: number;
}

export interface PlayerComponent extends Component {
  type: ComponentTypeValue;
  activeSlot: number;
  isSprinting: boolean;
  isCrouching: boolean;
  isRolling: boolean;
  rollStartTime: number;
  rollDirection: [number, number, number];
}

export interface EnemyComponent extends Component {
  type: ComponentTypeValue;
  enemyType: string;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  lastAttackTime: number;
  stunDuration: number;
  stunnedUntil?: number;
}

export interface ProjectileComponent extends Component {
  type: ComponentTypeValue;
  damage: number;
  speed: number;
  knockback: number;
  lifetime: number;
  spawnTime: number;
  ownerId?: number;
}

export interface ParticleComponent extends Component {
  type: ComponentTypeValue;
  particleType: string;
  lifetime: number;
  spawnTime: number;
}

export interface ObstacleComponent extends Component {
  type: ComponentTypeValue;
  isDestructible: boolean;
  health?: number;
}
