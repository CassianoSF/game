import * as THREE from 'three';
import { createPool, type ObjectPool } from '../core/pool/ObjectPool';
import type { ProjectileCreationData } from '../core/config/types';
import type { PoolableObject } from '../core/pool/types';

interface PooledProjectile extends PoolableObject {
  id: string;
  mesh?: THREE.Mesh;
  body?: any;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  rotation: THREE.Quaternion;
  stats: any;
  createTime: number;
  active: boolean;

  reset(): void;
}

let projectilePool: ObjectPool<PooledProjectile> | null = null;

export function getProjectilePool(): ObjectPool<PooledProjectile> {
  if (!projectilePool) {
    projectilePool = createPool<PooledProjectile>(() => {
      return {
        id: '',
        position: new THREE.Vector3(),
        direction: new THREE.Vector3(),
        rotation: new THREE.Quaternion(),
        stats: {},
        createTime: Date.now(),
        active: false,
        reset() {
          this.id = '';
          this.position.set(0, 0, 0);
          this.direction.set(0, 0, 1);
          this.rotation.set(0, 0, 0, 1);
          this.stats = {};
          this.createTime = Date.now();
          this.active = false;
        }
      };
    }, {
      initialSize: 20,
      maxSize: 100,
      growthFactor: 5
    });
  }
  return projectilePool;
}

export function createPooledProjectile(data: ProjectileCreationData): PooledProjectile {
  const pool = getProjectilePool();
  const projectile = pool.acquire();

  projectile.id = `projectile_${Date.now()}_${Math.random()}`;
  projectile.position.set(data.position[0], data.position[1], data.position[2]);
  projectile.direction.set(data.direction[0], data.direction[1], data.direction[2]);
  projectile.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2], data.rotation[3]);
  projectile.stats = data.stats;
  projectile.createTime = Date.now();

  return projectile;
}

export function releasePooledProjectile(projectile: PooledProjectile): void {
  const pool = getProjectilePool();
  
  if (projectile.mesh) {
    projectile.mesh.geometry?.dispose();
    if (Array.isArray(projectile.mesh.material)) {
      projectile.mesh.material.forEach(m => m.dispose());
    } else {
      projectile.mesh.material?.dispose();
    }
    projectile.mesh = undefined;
  }

  pool.release(projectile);
}

export function getProjectilePoolStats() {
  return getProjectilePool().getStats();
}
