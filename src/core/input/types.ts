export type InputAction =
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'crouch'
  | 'sprint'
  | 'roll'
  | 'jump'
  | 'attack'
  | 'reload'
  | 'weaponSlot1'
  | 'weaponSlot2'
  | 'weaponSlot3'
  | 'weaponSlot4'
  | 'weaponSlot5'
  | 'weaponSlot6'
  | 'weaponSlot7'
  | 'weaponSlot8'
  | 'weaponSlot9'
  | 'weaponSlot0'
  | 'toggleInventory'
  | 'interact';

export interface InputBinding {
  keys: string[];
  action: InputAction;
}

export interface InputBindings {
  [action: string]: string[];
}

export interface InputState {
  isDown: boolean;
  wasDown: boolean;
  value: number;
}
