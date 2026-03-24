import type { EntitySystem, SystemStats } from '../../ecs/System';
import { COMPONENT_TYPES, type WeaponComponent, type TransformComponent } from '../../ecs/components';
import { getEventBus } from '../../events/EventBus';
import type { GameEventType } from '../../events/types';

export class CombatSystem implements EntitySystem {
  name = 'CombatSystem';
  priority = 60;
  requiredComponents = [COMPONENT_TYPES.WEAPON];
  
  private stats: SystemStats = {
    name: this.name,
    entitiesProcessed: 0,
    executionTime: 0,
  };

  update(entities: any[]): void {
    const startTime = performance.now();
    
    for (const entity of entities) {
      this.stats.entitiesProcessed++;
      
      const weapon = entity.components.get(COMPONENT_TYPES.WEAPON) as WeaponComponent;
      const transform = entity.components.get(COMPONENT_TYPES.TRANSFORM) as TransformComponent;

      if (!weapon || !transform) continue;

      const now = Date.now();
      const timeSinceLastFire = now - weapon.lastFireTime;
      const weaponData = (window as any).WEAPONS?.[weapon.weaponId];
      
      if (this.isFiring() && timeSinceLastFire >= (weaponData?.fireRate || 1000)) {
        this.fireWeapon(weapon, transform);
      }

      if (weapon.reloading) {
        const reloadTime = weaponData?.reloadTime || 2000;
        if (now - weapon.reloadTime >= reloadTime) {
          weapon.reloading = false;
          weapon.currentAmmo = weapon.maxAmmo;
          
          getEventBus().emit('weapon_fired' as GameEventType, {
            weaponId: weapon.weaponId,
            position: transform.position,
          });
        }
      }
    }

    this.stats.executionTime = performance.now() - startTime;
  }

  private isFiring(): boolean {
    const input = (window as any).inputManager;
    if (!input) return false;
    return input.isPressed('attack') || false;
  }

  private fireWeapon(weapon: WeaponComponent, transform: TransformComponent): void {
    weapon.lastFireTime = Date.now();
    weapon.currentAmmo--;

    if (weapon.currentAmmo <= 0) {
      weapon.reloading = true;
      weapon.reloadTime = Date.now();
    }

    getEventBus().emit('weapon_fired' as GameEventType, {
      weaponId: weapon.weaponId,
      position: transform.position,
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

let combatSystemInstance: CombatSystem | null = null;

export function getCombatSystem(): CombatSystem {
  if (!combatSystemInstance) {
    combatSystemInstance = new CombatSystem();
  }
  return combatSystemInstance;
}
