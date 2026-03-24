export type GameEventType =
  | 'enemy_damaged'
  | 'enemy_killed'
  | 'player_damaged'
  | 'player_killed'
  | 'weapon_fired'
  | 'projectile_hit'
  | 'level_loaded'
  | 'level_reset'
  | 'item_picked_up'
  | 'sound_played';

export type GameEventMap = {
  enemy_damaged: { id: string; damage: number; position: [number, number, number] };
  enemy_killed: { id: string; position: [number, number, number] };
  player_damaged: { amount: number; currentHp: number; maxHp: number };
  player_killed: {};
  weapon_fired: { weaponId: string; position: [number, number, number] };
  projectile_hit: { targetId: string; damage: number; position: [number, number, number] };
  level_loaded: { levelId: string };
  level_reset: {};
  item_picked_up: { itemId: string; itemType: string };
  sound_played: { soundId: string; volume: number };
};

export type GameEvent = {
  [K in GameEventType]: { type: K; payload: GameEventMap[K] };
}[GameEventType];

export type EventHandler<T extends GameEventType> = (event: { type: T; payload: GameEventMap[T] }) => void;

export interface EventBusInterface {
  on<T extends GameEventType>(eventType: T, handler: EventHandler<T>): () => void;
  emit<T extends GameEventType>(eventType: T, payload: GameEventMap[T]): void;
  off<T extends GameEventType>(eventType: T, handler: EventHandler<T>): void;
}
