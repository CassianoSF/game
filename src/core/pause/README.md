# Sistema de Pause Centralizado

Sistema centralizado para pausar o jogo sem espalhar lógica em cada entidade.

## Conceito

Em vez de cada entidade verificar se está pausada, usamos um wrapper para `useFrame` que injeta `delta = 0` quando o jogo está pausado.

**Como funciona:**
- Quando o jogo roda: `useFrame((state, delta) => ...)`
- Quando pausado: `useFrame((state, 0) => ...)`
- Como a lógica depende de `delta`, naturalmente para

## Uso

### Antes (espalhando lógica):
```tsx
useFrame((state, delta) => {
    if (gameState === 'paused') return;  // ❌ Lógica em cada entidade
    position.x += speed * delta;
});
```

### Depois (centralizado):
```tsx
import { usePausedFrame } from './core/pause';

usePausedFrame((state, delta) => {
    // Quando pausado, delta = 0
    position.x += speed * delta;  // ✅ Para automaticamente
});
```

## Como funciona internamente

```tsx
// src/core/pause/PauseFrame.ts
const isPausedRef = { current: false };

export function usePausedFrame(callback) {
    useFrame((state, delta) => {
        // Se pausado, delta = 0
        callback(state, isPausedRef.current ? 0 : delta);
    });
}

// Monitora o gameState do store
initPauseSystem() {
    useStore.subscribe((state) => {
        isPausedRef.current = state.gameState === 'paused';
    });
}
```

## Exemplos de uso

### 1. Player com movimento baseado em delta
```tsx
usePausedFrame((state, delta) => {
    position.x += speed * delta;  // Para quando delta = 0
});
```

### 2. Animações do Three.js
```tsx
usePausedFrame((state, delta) => {
    mixer.update(delta);  // Para quando delta = 0
});
```

### 3. Cooldowns e timers
```tsx
const timer = useRef(0);

usePausedFrame((state, delta) => {
    timer.current += delta;  // Para quando delta = 0
});
```

### 4. Sistema de partículas
```tsx
usePausedFrame((state, delta) => {
    particles.forEach(p => {
        p.lifetime -= delta;  // Para quando delta = 0
    });
});
```

## Vantagens

✅ **Centralizado**: Um ponto de verdade
✅ **Escalável**: Adicionar 1000 entidades = 1 linha de código
✅ **Desacoplado**: Entidades não conhecem pause
✅ **Performático**: Zero overhead
✅ **Type-safe**: Full TypeScript

## Animações do Three.js

Para animações do Three.js, o wrapper `usePausedFrame` passa `delta = 0`, então:

```tsx
const { mixer } = useAnimations(animations, ref);

usePausedFrame((state, delta) => {
    mixer.update(delta);  // Para automaticamente quando delta = 0
});
```

## Animações via @react-three/drei

Se você usa `useAnimations` do drei, ele atualiza o mixer automaticamente no `useFrame`. Substitua:

```tsx
// ❌ Não controla delta
const { actions } = useAnimations(animations, ref);

// ✅ Controla delta
const { mixer } = useAnimations(animations, ref);
usePausedFrame((state, delta) => {
    mixer.update(delta);
});
```

## Notas Importantes

1. **Tudo deve depender de delta**: Se você não usa delta, o wrapper não funciona

2. **Animações automáticas**: Alguns sistemas atualizam sozinhos. Você precisa substituir o update manual

3. **Eventos independentes**: Eventos como colisões continuam funcionando (isso é desejável)

4. **Renderização**: O Canvas continua renderizando (menu de pause precisa aparecer)

## Migrando entidades existentes

```tsx
// Antes
useFrame((state, delta) => {
    if (gameState === 'paused') return;
    // lógica
});

// Depois
usePausedFrame((state, delta) => {
    // lógica (para automaticamente quando delta = 0)
});
```
