import type { EntitySystem, SystemStats } from '../../ecs/System';
import { COMPONENT_TYPES, type AIComponent, type TransformComponent, type HealthComponent } from '../../ecs/components';
import { getEventBus } from '../../events/EventBus';
import type { GameEventType } from '../../events/types';
import { getWorld } from '../../ecs/World';

export type AIState = 'IDLE' | 'WANDER' | 'CHASE' | 'ATTACK' | 'INVESTIGATE' | 'DEAD';

export class AISystem implements EntitySystem {
  name = 'AISystem';
  priority = 90;
  requiredComponents = [COMPONENT_TYPES.AI];
  
  private stats: SystemStats = {
    name: this.name,
    entitiesProcessed: 0,
    executionTime: 0,
  };

  private wanderTarget: [number, number, number] | null = null;

  update(aiEntities: any[]): void {
    const startTime = performance.now();
    
    for (const entity of aiEntities) {
      this.stats.entitiesProcessed++;
      
      const ai = entity.components.get(COMPONENT_TYPES.AI) as AIComponent;
      const health = entity.components.get(COMPONENT_TYPES.HEALTH) as HealthComponent;
      const transform = entity.components.get(COMPONENT_TYPES.TRANSFORM) as TransformComponent;

      if (!ai || !health || !transform) continue;

      if (health.isDead) {
        ai.state = 'DEAD';
        continue;
      }

      const playerPos = this.findPlayerPosition();
      if (!playerPos) continue;

      const distance = this.calculateDistance(transform.position, playerPos);
      
      const newState = this.calculateNewState(ai, distance);
      if (newState !== ai.state) {
        ai.state = newState;
      }

      const movement = this.calculateMovement(ai, transform, playerPos);
      
      const enemy = entity.components.get(COMPONENT_TYPES.ENEMY) as any;
      if (enemy) {
        const now = Date.now();
        
        if (ai.state === 'ATTACK' && now - enemy.lastAttackTime >= enemy.attackCooldown) {
          this.performAttack(enemy, transform);
          enemy.lastAttackTime = now;
        }

        if (enemy.stunnedUntil && now < enemy.stunnedUntil) {
          return;
        }

        enemy.velocity = movement;
      }
    }

    this.stats.executionTime = performance.now() - startTime;
  }

  private findPlayerPosition(): [number, number, number] | null {
    const entities = getWorld()?.getEntityManager()?.getAllEntities() || [];
    
    for (const entity of entities) {
      if (entity.components.has(COMPONENT_TYPES.PLAYER)) {
        const transform = entity.components.get(COMPONENT_TYPES.TRANSFORM) as any;
        if (transform) {
          return transform.position;
        }
      }
    }
    return null;
  }

  private calculateDistance(pos1: [number, number, number], pos2: [number, number, number]): number {
    const dx = pos1[0] - pos2[0];
    const dy = pos1[1] - pos2[1];
    const dz = pos1[2] - pos2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private calculateNewState(ai: AIComponent, distance: number): AIState {
    if (distance < ai.aggroRange) {
      if (distance < 2) {
        return 'ATTACK';
      }
      return 'CHASE';
    } else if (ai.state === 'CHASE' && distance < ai.loseSightRange * 1.5) {
      return 'INVESTIGATE';
    } else if (ai.state === 'INVESTIGATE' && distance > ai.loseSightRange) {
      return 'IDLE';
    } else if (ai.state === 'IDLE' && Math.random() < 0.01) {
      return 'WANDER';
    } else if (ai.state === 'WANDER' && Math.random() < 0.02) {
      return 'IDLE';
    }
    return ai.state as AIState;
  }

  private calculateMovement(ai: AIComponent, transform: TransformComponent, playerPos: [number, number, number]): [number, number, number] {
    const speed = ai.state === 'CHASE' ? 6 : 2;
    
    let targetPosition: [number, number, number];
    
    switch (ai.state) {
      case 'CHASE':
      case 'ATTACK':
        targetPosition = playerPos;
        break;
      case 'WANDER':
        if (!this.wanderTarget || Math.random() < 0.05) {
          this.wanderTarget = [
            transform.position[0] + (Math.random() - 0.5) * 10,
            0,
            transform.position[2] + (Math.random() - 0.5) * 10
          ];
        }
        targetPosition = this.wanderTarget;
        break;
      case 'INVESTIGATE':
        targetPosition = ai.lastKnownPlayerPosition || playerPos;
        break;
      default:
        targetPosition = transform.position;
        break;
    }

    const dx = targetPosition[0] - transform.position[0];
    const dz = targetPosition[2] - transform.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > 0.1) {
      return [dx / distance * speed, 0, dz / distance * speed];
    }
    
    return [0, 0, 0];
  }

  private performAttack(enemy: any, transform: TransformComponent): void {
    const playerPos = this.findPlayerPosition();
    if (!playerPos) return;

    const distance = this.calculateDistance(transform.position, playerPos);
    if (distance > 3) return;

    getEventBus().emit('enemy_damaged' as GameEventType, {
      id: enemy.id,
      damage: enemy.damage,
      position: transform.position,
    });

    const health = (window as any).playerHealth || 100;
    getEventBus().emit('player_damaged' as GameEventType, {
      amount: enemy.damage,
      currentHp: health - enemy.damage,
      maxHp: 100,
    });
  }

  getStats(): SystemStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats.entitiesProcessed = 0;
    this.stats.executionTime = 0;
  }
}

let aiSystemInstance: AISystem | null = null;

export function getAISystem(): AISystem {
  if (!aiSystemInstance) {
    aiSystemInstance = new AISystem();
  }
  return aiSystemInstance;
}
