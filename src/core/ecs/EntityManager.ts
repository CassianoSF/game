import type { Entity, EntityId, Component } from './types';
import type { ComponentTypeValue } from './components';

export class EntityManager {
  private entities: Map<EntityId, Entity> = new Map();
  private nextId: EntityId = 1;
  private entityPool: Entity[] = [];

  createEntity(): Entity {
    const id = this.nextId++;
    const entity: Entity = {
      id,
      components: new Map(),
      active: true,
    };
    this.entities.set(id, entity);
    return entity;
  }

  createEntityWithId(id: EntityId): Entity {
    const entity: Entity = {
      id,
      components: new Map(),
      active: true,
    };
    this.entities.set(id, entity);
    if (id >= this.nextId) {
      this.nextId = id + 1;
    }
    return entity;
  }

  destroyEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.components.clear();
      entity.active = false;
      this.entities.delete(id);
      this.entityPool.push(entity);
    }
  }

  addComponent<T extends Component>(entityId: EntityId, component: T): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.components.set(component.type as ComponentTypeValue, component);
      component.entity = entity;
    }
  }

  getComponent<T extends Component>(entityId: EntityId, componentType: string): T | undefined {
    const entity = this.entities.get(entityId);
    return entity?.components.get(componentType) as T | undefined;
  }

  hasComponent(entityId: EntityId, componentType: string): boolean {
    const entity = this.entities.get(entityId);
    return entity?.components.has(componentType) || false;
  }

  removeComponent(entityId: EntityId, componentType: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.components.delete(componentType);
    }
  }

  getEntitiesWithComponents(componentTypes: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (!entity.active) continue;
      
      let hasAll = true;
      for (const type of componentTypes) {
        if (!entity.components.has(type)) {
          hasAll = false;
          break;
        }
      }
      
      if (hasAll) {
        result.push(entity);
      }
    }
    return result;
  }

  getEntitiesWithAnyComponent(componentTypes: string[]): Entity[] {
    const result: Entity[] = [];
    for (const entity of this.entities.values()) {
      if (!entity.active) continue;
      
      for (const type of componentTypes) {
        if (entity.components.has(type)) {
          result.push(entity);
          break;
        }
      }
    }
    return result;
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  getActiveEntities(): Entity[] {
    return this.getAllEntities().filter(e => e.active);
  }

  clear(): void {
    for (const entity of this.entities.values()) {
      entity.components.clear();
      entity.active = false;
    }
    this.entities.clear();
    this.nextId = 1;
  }

  getStats(): { total: number; active: number; inactive: number } {
    const all = Array.from(this.entities.values());
    return {
      total: all.length,
      active: all.filter(e => e.active).length,
      inactive: all.filter(e => !e.active).length,
    };
  }
}

let entityManagerInstance: EntityManager | null = null;

export function getEntityManager(): EntityManager {
  if (!entityManagerInstance) {
    entityManagerInstance = new EntityManager();
  }
  return entityManagerInstance;
}
