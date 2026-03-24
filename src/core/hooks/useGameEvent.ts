import { useEffect } from 'react';
import { getEventBus } from '../events/EventBus';
import type { GameEventType, GameEventMap } from '../events/types';

export function useGameEvent<T extends GameEventType>(
  eventType: T,
  handler: (event: { type: T; payload: GameEventMap[T] }) => void
): void {
  useEffect(() => {
    const unsubscribe = getEventBus().on(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
}
