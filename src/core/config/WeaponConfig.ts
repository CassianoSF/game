export type WeaponType = 'pistol' | 'machine_gun' | 'shotgun';

export interface WeaponStats {
  damage: number;
  fireRate: number;
  speed: number;
  color: string;
  projectiles: number;
  spread: number;
  knockback: number;
}

export interface Weapon {
  id: string;
  name: string;
  type: WeaponType;
  icon: string;
  stats: WeaponStats;
}

export const WEAPONS: Record<string, Weapon> = {
  pistol: {
    id: 'pistol',
    name: 'Pistol',
    icon: '🔫',
    stats: {
      damage: 25,
      fireRate: 0.4,
      speed: 40,
      color: 'white',
      projectiles: 1,
      spread: 0,
      knockback: 0.3,
    },
    type: 'pistol',
  },
  machine_gun: {
    id: 'machine_gun',
    name: 'Machine Gun',
    icon: '🔥',
    stats: {
      damage: 40,
      fireRate: 0.1,
      speed: 80,
      color: 'white',
      projectiles: 1,
      spread: 0.1,
      knockback: 0.5,
    },
    type: 'machine_gun',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    icon: '💥',
    stats: {
      damage: 15,
      fireRate: 1.0,
      speed: 30,
      color: 'white',
      projectiles: 5,
      spread: 0.3,
      knockback: 0.8,
    },
    type: 'shotgun',
  },
};

export const WEAPON_TYPES: WeaponType[] = ['pistol', 'machine_gun', 'shotgun'];

export function getWeapon(id: string): Weapon | undefined {
  return WEAPONS[id];
}

export function getWeaponsByType(type: WeaponType): Weapon[] {
  return Object.values(WEAPONS).filter((w) => w.type === type);
}
