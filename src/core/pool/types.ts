export interface PoolableObject {
  reset?(): void;
  active?: boolean;
}

export interface PoolOptions {
  initialSize?: number;
  maxSize?: number;
  growthFactor?: number;
}

export interface PoolStats {
  totalCreated: number;
  totalDestroyed: number;
  totalReused: number;
  currentSize: number;
  activeObjects: number;
  inactiveObjects: number;
}
