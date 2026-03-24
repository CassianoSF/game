import { useEffect, useRef } from 'react';
import type { InputAction, InputState } from './types';
import { DEFAULT_BINDINGS } from './defaults';

export class InputManager {
  private bindings: Map<string, InputAction> = new Map();
  private keyStates: Map<string, boolean> = new Map();
  private mouseButtonStates: Map<number, boolean> = new Map();
  private actionStates: Map<InputAction, InputState> = new Map();

  constructor(bindings?: Record<InputAction, string[]>) {
    this.bindings = this.createBindingsMap(bindings || DEFAULT_BINDINGS);
    this.initializeActionStates();
  }

  private createBindingsMap(bindings: Record<InputAction, string[]>): Map<string, InputAction> {
    const map = new Map<string, InputAction>();
    for (const [action, keys] of Object.entries(bindings)) {
      for (const key of keys) {
        map.set(key, action as InputAction);
      }
    }
    return map;
  }

  private initializeActionStates(): void {
    const actions: InputAction[] = [
      'moveForward', 'moveBackward', 'moveLeft', 'moveRight',
      'crouch', 'sprint', 'roll', 'jump', 'attack', 'reload',
      'weaponSlot1', 'weaponSlot2', 'weaponSlot3', 'weaponSlot4', 'weaponSlot5',
      'weaponSlot6', 'weaponSlot7', 'weaponSlot8', 'weaponSlot9', 'weaponSlot0',
      'toggleInventory', 'interact',
    ];
    
    for (const action of actions) {
      this.actionStates.set(action, { isDown: false, wasDown: false, value: 0 });
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const action = this.bindings.get(event.code);
    if (action) {
      this.keyStates.set(event.code, true);
      const state = this.actionStates.get(action);
      if (state) {
        state.wasDown = state.isDown;
        state.isDown = true;
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const action = this.bindings.get(event.code);
    if (action) {
      this.keyStates.set(event.code, false);
      const state = this.actionStates.get(action);
      if (state) {
        state.wasDown = state.isDown;
        state.isDown = false;
      }
    }
  };

  private handleMouseDown = (event: MouseEvent): void => {
    const action = this.bindings.get(`Mouse${event.button}`);
    if (action) {
      this.mouseButtonStates.set(event.button, true);
      const state = this.actionStates.get(action);
      if (state) {
        state.wasDown = state.isDown;
        state.isDown = true;
      }
    }
  };

  private handleMouseUp = (event: MouseEvent): void => {
    const action = this.bindings.get(`Mouse${event.button}`);
    if (action) {
      this.mouseButtonStates.set(event.button, false);
      const state = this.actionStates.get(action);
      if (state) {
        state.wasDown = state.isDown;
        state.isDown = false;
      }
    }
  };

  private resetWasDown = (): void => {
    for (const state of this.actionStates.values()) {
      state.wasDown = false;
    }
  };

  public isPressed(action: InputAction): boolean {
    return this.actionStates.get(action)?.isDown || false;
  }

  public wasPressed(action: InputAction): boolean {
    return this.actionStates.get(action)?.wasDown || false;
  }

  public getActionState(action: InputAction): InputState {
    return this.actionStates.get(action) || { isDown: false, wasDown: false, value: 0 };
  }

  public bind(action: InputAction, keys: string[]): void {
    for (const key of keys) {
      this.bindings.set(key, action);
    }
  }

  public unbind(key: string): void {
    this.bindings.delete(key);
  }

  public enable(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  public disable(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
  }

  public update(): void {
    this.resetWasDown();
  }
}

export function useInputManager(bindings?: Record<InputAction, string[]>): InputManager {
  const managerRef = useRef<InputManager | null>(null);

  if (!managerRef.current) {
    managerRef.current = new InputManager(bindings);
  }

  useEffect(() => {
    const manager = managerRef.current;
    if (manager) {
      manager.enable();
      return () => manager.disable();
    }
  }, []);

  return managerRef.current!;
}
