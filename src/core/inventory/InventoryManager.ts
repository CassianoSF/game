import type { Weapon } from '../config/WeaponConfig';
import type { InventoryMoveResult } from '../config/types';

export function moveItem(
  inventory: (Weapon | null)[],
  hotbar: (Weapon | null)[],
  fromContainer: 'inventory' | 'hotbar',
  fromSlot: number,
  toContainer: 'inventory' | 'hotbar',
  toSlot: number
): InventoryMoveResult {
  const nextInventory = [...inventory];
  const nextHotbar = [...hotbar];

  const getList = (container: 'inventory' | 'hotbar') =>
    container === 'inventory' ? nextInventory : nextHotbar;
  const sourceList = getList(fromContainer);
  const targetList = getList(toContainer);

  const itemToMove = sourceList[fromSlot];
  const itemAtTarget = targetList[toSlot];

  sourceList[fromSlot] = itemAtTarget;
  targetList[toSlot] = itemToMove;

  return { nextInventory, nextHotbar };
}

export function addToInventory(
  inventory: (Weapon | null)[],
  weapon: Weapon
): (Weapon | null)[] {
  const firstEmpty = inventory.indexOf(null);
  if (firstEmpty === -1) return inventory;

  const nextInventory = [...inventory];
  nextInventory[firstEmpty] = weapon;
  return nextInventory;
}
