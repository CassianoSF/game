import type { EntitySystem, SystemStats } from '../../ecs/System';
import { COMPONENT_TYPES, type TransformComponent, type VelocityComponent } from '../../ecs/components';
import { useInputManager } from '../../input/InputManager';

export class MovementSystem implements EntitySystem {
  name = 'MovementSystem';
  priority = 80;
  requiredComponents = [COMPONENT_TYPES.VELOCITY];
  
  private stats: SystemStats = {
    name: this.name,
    entitiesProcessed: 0,
    executionTime: 0,
  };

  private input = useInputManager();

  update(entities: any[]): void {
    const startTime = performance.now();
    
    for (const entity of entities) {
      this.stats.entitiesProcessed++;
      
      const velocity = entity.components.get(COMPONENT_TYPES.VELOCITY) as VelocityComponent;
      const transform = entity.components.get(COMPONENT_TYPES.TRANSFORM) as TransformComponent;

      if (!velocity || !transform) continue;

      let targetSpeed = 5;
      const inputX = this.input.isPressed('moveLeft') ? -1 : (this.input.isPressed('moveRight') ? 1 : 0);
      const inputZ = this.input.isPressed('moveForward') ? 1 : (this.input.isPressed('moveBackward') ? -1 : 0);

      if (this.input.isPressed('sprint') && velocity.velocity[1] > 0) {
        const stats = entity.components.get(COMPONENT_TYPES.STATS) as any;
        if (stats?.stamina > 0) {
          targetSpeed *= 1.5;
        }
      } else if (this.input.isPressed('crouch')) {
        targetSpeed *= 0.5;
      }

      const speed = Math.sqrt(inputX ** 2 + inputZ ** 2);
      const normalizedSpeed = speed > 0 ? 1 : 0;
      
      velocity.velocity[0] = (inputX / normalizedSpeed) * targetSpeed;
      velocity.velocity[2] = (inputZ / normalizedSpeed) * targetSpeed;

      this.input.update();
    }

    this.stats.executionTime = performance.now() - startTime;
  }

  getStats(): SystemStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats.entitiesProcessed = 0;
    this.stats.executionTime = 0;
  }
}

let movementSystemInstance: MovementSystem | null = null;

export function getMovementSystem(): MovementSystem {
  if (!movementSystemInstance) {
    movementSystemInstance = new MovementSystem();
  }
  return movementSystemInstance;
}
