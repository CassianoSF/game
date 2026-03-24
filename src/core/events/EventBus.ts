import type { GameEventType, EventHandler, EventBusInterface, GameEvent, GameEventMap } from './types';

export class EventBus implements EventBusInterface {
  private handlers: Map<GameEventType, Set<EventHandler<any>>> = new Map();
  private history: GameEvent[] = [];
  private maxHistorySize = 100;

  private ensureHandlerSet(eventType: GameEventType): Set<EventHandler<any>> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    return this.handlers.get(eventType)!;
  }

  public on<T extends GameEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): () => void {
    const handlers = this.ensureHandlerSet(eventType);
    handlers.add(handler as EventHandler<any>);

    return () => {
      this.off(eventType, handler as EventHandler<any>);
    };
  }

  public emit<T extends GameEventType>(
    eventType: T,
    payload: GameEventMap[T]
  ): void {
    const event = { type: eventType, payload } as GameEvent;
    
    this.addToHistory(event);

    const handlers = this.handlers.get(eventType);
    if (handlers) {
      for (const handler of handlers) {
        try {
          (handler as (event: GameEvent) => void)(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      }
    }
  }

  public off<T extends GameEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler as EventHandler<any>);
    }
  }

  public once<T extends GameEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): void {
    const wrappedHandler = (event: { type: T; payload: GameEventMap[T] }) => {
      (handler as EventHandler<any>)(event);
      this.off(eventType, handler as EventHandler<any>);
    };

    this.on(eventType, wrappedHandler as EventHandler<any>);
  }

  public clear(): void {
    this.handlers.clear();
    this.history = [];
  }

  public clearHistory(): void {
    this.history = [];
  }

  public getHistory(): GameEvent[] {
    return [...this.history];
  }

  private addToHistory(event: GameEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  public getHandlerCount(eventType: GameEventType): number {
    return this.handlers.get(eventType)?.size || 0;
  }
}

let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function eventBus(): EventBus {
  return getEventBus();
}
