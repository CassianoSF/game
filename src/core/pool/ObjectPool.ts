import type { PoolableObject, PoolOptions, PoolStats } from './types';

export class ObjectPool<T extends PoolableObject> {
  private factory: () => T;
  private pool: T[] = [];
  private activeObjects: Set<T> = new Set();
  private initialSize: number;
  private maxSize: number;
  private growthFactor: number;
  
  private stats: PoolStats = {
    totalCreated: 0,
    totalDestroyed: 0,
    totalReused: 0,
    currentSize: 0,
    activeObjects: 0,
    inactiveObjects: 0,
  };

  constructor(factory: () => T, options: PoolOptions = {}) {
    this.factory = factory;
    this.initialSize = options.initialSize || 10;
    this.maxSize = options.maxSize || 100;
    this.growthFactor = options.growthFactor || 2;

    this.preallocate();
  }

  private preallocate(): void {
    for (let i = 0; i < this.initialSize; i++) {
      const obj = this.factory();
      if (obj.reset) {
        obj.reset();
      }
      obj.active = false;
      this.pool.push(obj);
      this.stats.totalCreated++;
    }
    this.updateStats();
  }

  public acquire(): T {
    let obj = this.pool.pop();

    if (!obj) {
      if (this.pool.length + this.activeObjects.size >= this.maxSize) {
        console.warn('Object pool reached maximum size, recycling active object');
        const active = Array.from(this.activeObjects)[0];
        this.release(active);
        obj = active;
      } else {
        const newSize = Math.min(
          this.pool.length + this.activeObjects.size + this.growthFactor,
          this.maxSize
        );
        const toCreate = newSize - (this.pool.length + this.activeObjects.size);
        
        for (let i = 0; i < toCreate; i++) {
          const newObj = this.factory();
          if (newObj.reset) {
            newObj.reset();
          }
          newObj.active = false;
          this.pool.push(newObj);
          this.stats.totalCreated++;
        }
        obj = this.pool.pop();
      }
    } else {
      this.stats.totalReused++;
    }

    if (obj) {
      obj.active = true;
      this.activeObjects.add(obj);
      this.updateStats();
    }

    return obj!;
  }

  public release(obj: T): void {
    if (!this.activeObjects.has(obj)) {
      console.warn('Attempting to release object that is not active');
      return;
    }

    this.activeObjects.delete(obj);
    
    if (obj.reset) {
      obj.reset();
    }
    
    obj.active = false;
    this.pool.push(obj);
    this.stats.totalDestroyed++;
    this.updateStats();
  }

  public getStats(): PoolStats {
    return { ...this.stats };
  }

  public clear(): void {
    for (const obj of this.activeObjects) {
      if (obj.reset) {
        obj.reset();
      }
    }
    this.activeObjects.clear();
    this.pool = [];
    this.stats = {
      totalCreated: 0,
      totalDestroyed: 0,
      totalReused: 0,
      currentSize: 0,
      activeObjects: 0,
      inactiveObjects: 0,
    };
  }

  public resize(newSize: number): void {
    const currentSize = this.pool.length + this.activeObjects.size;
    
    if (newSize > currentSize) {
      const toAdd = newSize - currentSize;
      for (let i = 0; i < toAdd; i++) {
        const obj = this.factory();
        if (obj.reset) {
          obj.reset();
        }
        obj.active = false;
        this.pool.push(obj);
        this.stats.totalCreated++;
      }
    } else if (newSize < currentSize) {
      const toRemove = currentSize - newSize;
      for (let i = 0; i < toRemove && this.pool.length > 0; i++) {
        this.pool.pop();
      }
    }
    
    this.updateStats();
  }

  private updateStats(): void {
    this.stats.currentSize = this.pool.length + this.activeObjects.size;
    this.stats.activeObjects = this.activeObjects.size;
    this.stats.inactiveObjects = this.pool.length;
  }
}

export function createPool<T extends PoolableObject>(
  factory: () => T,
  options?: PoolOptions
): ObjectPool<T> {
  return new ObjectPool(factory, options);
}
