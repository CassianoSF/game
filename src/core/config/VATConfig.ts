export interface VATAnimation {
  start: number;
  end: number;
  duration: number;
}

export interface VATMeta {
  vertices: number;
  frames: number;
  fps: number;
  animations: Record<string, VATAnimation>;
}

export const ZOMBIE_ANIMATIONS: Record<string, string> = {
  IDLE: 'zombie idle',
  WANDER: 'zombie walk',
  INVESTIGATE: 'zombie walk',
  CHASE: 'zombie run',
  ATTACK: 'zombie attack',
  DEAD: 'zombie death',
};
