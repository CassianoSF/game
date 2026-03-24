import type { InputAction } from './types';

const DEFAULT_BINDINGS: Record<InputAction, string[]> = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  crouch: ['ControlLeft', 'ControlRight', 'Control'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  roll: ['Space'],
  jump: ['Space'],
  attack: ['MouseLeft'],
  reload: ['KeyR'],
  weaponSlot1: ['Digit1'],
  weaponSlot2: ['Digit2'],
  weaponSlot3: ['Digit3'],
  weaponSlot4: ['Digit4'],
  weaponSlot5: ['Digit5'],
  weaponSlot6: ['Digit6'],
  weaponSlot7: ['Digit7'],
  weaponSlot8: ['Digit8'],
  weaponSlot9: ['Digit9'],
  weaponSlot0: ['Digit0'],
  toggleInventory: ['Tab'],
  interact: ['KeyE'],
};

export { DEFAULT_BINDINGS };
