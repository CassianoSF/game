import * as THREE from 'three';
import { createPool, type ObjectPool } from '../core/pool/ObjectPool';
import type { PoolableObject } from '../core/pool/types';

export type ParticleType = 'blood' | 'spark' | 'muzzle' | 'smoke' | 'fire';

interface PooledParticle extends PoolableObject {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  startTime: number;
  duration: number;
  type: ParticleType;
  active: boolean;

  reset(): void;
}

let particlePool: ObjectPool<PooledParticle> | null = null;

const PARTICLE_CONFIGS: Record<ParticleType, {
  color: number;
  baseSize: number;
  baseDuration: number;
}> = {
  blood: {
    color: 0x990000,
    baseSize: 0.3,
    baseDuration: 0.2,
  },
  spark: {
    color: 0xffaa00,
    baseSize: 0.15,
    baseDuration: 0.3,
  },
  muzzle: {
    color: 0xffffff,
    baseSize: 0.5,
    baseDuration: 0.08,
  },
  smoke: {
    color: 0x888888,
    baseSize: 0.4,
    baseDuration: 0.5,
  },
  fire: {
    color: 0xff4400,
    baseSize: 0.3,
    baseDuration: 0.2,
  }
};

export function getParticlePool(): ObjectPool<PooledParticle> {
  if (!particlePool) {
    particlePool = createPool<PooledParticle>(() => {
      return {
        id: '',
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 1,
        startTime: 0,
        duration: 1,
        type: 'blood',
        active: false,
        reset() {
          this.id = '';
          this.position.set(0, 0, 0);
          this.velocity.set(0, 0, 0);
          this.color.setHex(0xffffff);
          this.size = 1;
          this.startTime = 0;
          this.duration = 1;
          this.active = false;
        }
      };
    }, {
      initialSize: 50,
      maxSize: 500,
      growthFactor: 10
    });
  }
  return particlePool;
}

export function createParticle(
  position: THREE.Vector3,
  type: ParticleType,
  count: number = 1,
  direction?: THREE.Vector3
): PooledParticle[] {
  const pool = getParticlePool();
  const particles: PooledParticle[] = [];
  const config = PARTICLE_CONFIGS[type];

  for (let i = 0; i < count; i++) {
    const particle = pool.acquire();
    
    particle.id = `particle_${Date.now()}_${Math.random()}`;
    particle.position.copy(position);
    
    const spread = type === 'muzzle' ? 0.3 : 0.5;
    const speed = type === 'muzzle' ? 8 : 5;
    
    particle.velocity.set(
      (Math.random() - 0.5) * spread,
      Math.random() * 2,
      (Math.random() - 0.5) * spread
    );

    if (direction) {
      const forwardSpeed = speed + Math.random() * 3;
      particle.velocity.x += direction.x * forwardSpeed;
      particle.velocity.y += direction.y * forwardSpeed + (type === 'muzzle' ? 2 : 1);
      particle.velocity.z += direction.z * forwardSpeed;
    } else {
      particle.velocity.y += Math.random() * 3 + (type === 'fire' ? 2 : 0);
    }

    particle.color.setHex(config.color);
    
    if (type === 'muzzle') {
      const heat = Math.random();
      particle.color.setRGB(1.0, heat * 0.8 + 0.2, heat < 0.4 ? 0.0 : heat * 0.3);
    }

    particle.size = config.baseSize * (0.8 + Math.random() * 0.4);
    particle.startTime = Date.now();
    particle.duration = config.baseDuration * (0.8 + Math.random() * 0.4);
    particle.type = type;

    particles.push(particle);
  }

  return particles;
}

export function releaseParticle(particle: PooledParticle): void {
  const pool = getParticlePool();
  pool.release(particle);
}

export function getParticlePoolStats() {
  return getParticlePool().getStats();
}
