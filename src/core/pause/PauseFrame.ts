import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const isPausedRef = { current: false };

// Clock de jogo acumulado — para quando o jogo estiver pausado.
// Usar este valor em shaders e sistemas que precisam de tempo, em vez de performance.now()
export const gameTime = { current: 0 };

export function usePausedFrame(callback: (state: any, delta: number) => void) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useFrame((state, delta) => {
        if (isPausedRef.current) return; // pausado — callback não executa
        gameTime.current += delta;
        callbackRef.current(state, delta);
    });
}

export function useIsPaused() {
    return isPausedRef;
}

export function initPauseSystem() {
    import('../store').then(({ useStore }) => {
        useStore.subscribe((state) => {
            isPausedRef.current = state.gameState === 'paused';
        });
    });
}
