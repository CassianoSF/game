import { EntityManager } from './EntityManager';
import type { EntitySystem } from './System';

export class World {
  private entityManager: EntityManager;
  private systems: EntitySystem[] = [];
  private deltaTime: number = 0;
  private totalTime: number = 0;
  private frameCount: number = 0;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
  }

  addSystem(system: EntitySystem): void {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  removeSystem(system: EntitySystem): void {
    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  update(deltaTime: number): void {
    this.deltaTime = deltaTime;
    this.totalTime += deltaTime;
    this.frameCount++;

    for (const system of this.systems) {
      const requiredComponents = system.requiredComponents;
      const entities = this.entityManager.getEntitiesWithComponents(requiredComponents);

      system.update(entities, deltaTime, this);
    }
  }

  getEntityManager(): EntityManager {
    return this.entityManager;
  }

  getDeltaTime(): number {
    return this.deltaTime;
  }

  getTotalTime(): number {
    return this.totalTime;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getFPS(): number {
    return 1 / this.deltaTime;
  }

  clear(): void {
    this.entityManager.clear();
    this.totalTime = 0;
    this.frameCount = 0;
  }

  getStats(): {
    entities: ReturnType<EntityManager['getStats']>;
    systems: number;
    fps: number;
    totalTime: number;
    frameCount: number;
  } {
    return {
      entities: this.entityManager.getStats(),
      systems: this.systems.length,
      fps: this.getFPS(),
      totalTime: this.totalTime,
      frameCount: this.frameCount,
    };
  }
}

let worldInstance: World | null = null;

export function getWorld(): World {
  if (!worldInstance) {
    worldInstance = new World(new EntityManager());
  }
  return worldInstance;
}
