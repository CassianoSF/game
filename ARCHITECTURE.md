# Arquitetura Escalável para Múltiplas Entidades

## Visão Geral

Arquitetura para gerenciar milhares de entidades (inimigos, objetos, itens, carros, construções, etc) de forma centralizada e performática.

## Princípios Fundamentais

### 1. Separação de Responsabilidades (SoC)
- **Entidades**: Dados + apresentação (React components)
- **Sistemas**: Lógica centralizada (Systems)
- **Store**: Estado global (Zustand)

### 2. Data-Oriented Design
- Entidades são apenas dados
- Sistemas operam sobre conjuntos de entidades
- Melhor cache locality e performance

### 3. Event-Driven Architecture
- Comunicação via EventBus
- Desacoplamento total entre sistemas
- Facilita testing e extensão

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer (React)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Player   │ │ Enemy    │ │ Item     │ │ Prop     │         │
│  │ Component│ │ Component│ │ Component│ │ Manager  │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
└───────┼────────────┼────────────┼────────────┼────────────────┘
        │            │            │            │
        └────────────┼────────────┼────────────┘
                     │            │
┌────────────────────┼────────────┼─────────────────────────────┐
│                    ▼            ▼                              │
│              ┌─────────────────────────┐                      │
│              │      Global Store       │                      │
│              │  - gameState            │                      │
│              │  - entities             │                      │
│              │  - projectiles           │                      │
│              │  - inventory            │                      │
│              └───────────┬─────────────┘                      │
└────────────────────────┼──────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Systems     │  │  Systems     │  │  Systems     │
│  - Physics   │  │  - Combat    │  │  - Pause     │
│  - AI        │  │  - Spawn     │  │  - Animation │
│  - Movement  │  │  - Death     │  │  - Logic     │
└──────────────┘  └──────────────┘  └──────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │     EventBus        │
              │  - pause/resume    │
              │  - damage          │
              │  - death           │
              │  - spawn           │
              └─────────────────────┘
```

## Componentes da Arquitetura

### 1. Store Central (Zustand)

**Responsabilidade**: Fonte única de verdade para o estado global

```typescript
interface GameState {
  // Estado do jogo
  gameState: 'menu' | 'playing' | 'paused';

  // Entidades
  entities: Record<string, EntityData>;
  enemies: Record<string, EnemyData>;
  items: Record<string, ItemData>;
  projectiles: Record<string, ProjectileData>;

  // Ações
  addEntity: (entity: EntityData) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, data: Partial<EntityData>) => void;
}
```

**Vantagens**:
- Single source of truth
- Tipagem forte
- Performance otimizada (shallow comparison)

### 2. Sistemas (Systems)

**Responsabilidade**: Lógica centralizada por domínio

#### Exemplos de Sistemas:

```typescript
// src/systems/CombatSystem.ts
class CombatSystem {
  processHit(attacker: Entity, target: Entity) {
    // Lógica centralizada de dano
  }
}

// src/systems/SpawnSystem.ts
class SpawnSystem {
  spawnWave(waveConfig: WaveConfig) {
    // Lógica centralizada de spawn
  }
}

// src/systems/PauseSystem.ts
class PauseSystem {
  // Já implementado!
}
```

**Vantagens**:
- Reutilização de código
- Fácil manutenção
- Testabilidade

### 3. EventBus

**Responsabilidade**: Comunicação assíncrona entre componentes

```typescript
// Emissor
eventBus().emit('damage', {
  targetId: 'enemy-1',
  amount: 10,
  position: [0, 0, 0]
});

// Receptor
eventBus().on('damage', (event) => {
  console.log('Dano recebido:', event.payload);
});
```

**Vantagens**:
- Desacoplamento total
- Broadcasting para múltiplos receptores
- Logging automático de eventos

### 4. Entidades (React Components)

**Responsabilidade**: Apresentação + registro em sistemas

```typescript
function Enemy({ data }: { data: EnemyData }) {
  const bodyRef = useRef<RigidBody>(null);
  const meshRef = useRef<Group>(null);

  // Hook para IA
  useEnemyAI(data, bodyRef, meshRef);

  // Hook para pause
  usePauseLogic(
    data.id,
    () => {
      // Lógica de pause
    },
    () => {
      // Lógica de resume
    }
  );

  return (
    <RigidBody ref={bodyRef} userData={{ type: 'enemy', id: data.id }}>
      <group ref={meshRef} />
    </RigidBody>
  );
}
```

**Vantagens**:
- Declarativo
- Fácil composição
- React lifecycle management

## Implementando uma Nova Entidade

### Passo 1: Definir o tipo

```typescript
// src/core/entities/Item.types.ts
export interface ItemData {
  id: string;
  type: 'weapon' | 'health' | 'ammo';
  position: [number, number, number];
  value: number;
}
```

### Passo 2: Adicionar ao store

```typescript
// src/core/store.ts
interface GameState {
  items: Record<string, ItemData>;
  addItem: (item: ItemData) => void;
  removeItem: (id: string) => void;
}
```

### Passo 3: Criar hooks customizados (se necessário)

```typescript
// src/entities/items/useItemPickup.ts
export function useItemPickup(data: ItemData, bodyRef: Ref<RigidBody>) {
  useEffect(() => {
    const handler = (event: CollisionEvent) => {
      if (event.other.userData.type === 'player') {
        pickupItem(data.id);
      }
    };

    bodyRef.current?.addEventListener('collision', handler);
    return () => bodyRef.current?.removeEventListener('collision', handler);
  }, [data.id, bodyRef]);
}
```

### Passo 4: Criar o componente

```typescript
// src/entities/items/Item.tsx
export function Item({ data }: { data: ItemData }) {
  const bodyRef = useRef<RigidBody>(null);

  useItemPickup(data, bodyRef);
  usePauseLogic(data.id);

  return (
    <RigidBody ref={bodyRef} type="fixed" sensor position={data.position}>
      <mesh userData={{ type: 'item', id: data.id }}>
        <boxGeometry />
      </mesh>
    </RigidBody>
  );
}
```

### Passo 5: Criar o renderer

```typescript
// src/entities/items/ItemManager.tsx
export function ItemManager() {
  const items = useStore((state) => state.items);

  return (
    <>
      {Object.values(items).map((item) => (
        <Item key={item.id} data={item} />
      ))}
    </>
  );
}
```

## Padrões Comuns

### 1. Instancing para Múltiplas Cópias

**Para entidades idênticas (árvores, pedras, etc)**:

```typescript
export function TreeManager() {
  const trees = useStore((state) => state.trees);

  const { scene } = useGLTF('/models/Tree.glb');
  const meshRef = useRef<InstancedMesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;

    Object.values(trees).forEach((tree, index) => {
      const matrix = new Matrix4().makeTranslation(
        tree.position[0],
        tree.position[1],
        tree.position[2]
      );
      meshRef.current!.setMatrixAt(index, matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[scene.children[0].geometry, scene.children[0].material, Object.keys(trees).length]}
    />
  );
}
```

**Performance**: 1000+ árvores com um draw call

### 2. Pooling para Entidades Temporárias

**Para projéteis, partículas, etc**:

```typescript
const projectilePool = new ObjectPool<ProjectileData>(
  () => createProjectile(),
  100  // Pool size
);

// Usar
const projectile = projectilePool.acquire();
projectilePool.release(projectile);
```

**Vantagens**: Menos alocações de memória

### 3. Spatial Partitioning

**Para colisão eficientes com muitas entidades**:

```typescript
const spatialHash = new SpatialHash({
  cellSize: 10,
  worldSize: 1000
});

// Registrar
spatialHash.insert(entity.position, entity);

// Query
const nearby = spatialHash.query(player.position, radius);
```

**Performance**: O(1) para queries ao invés de O(n)

## Otimizações de Performance

### 1. useFrame com Throttle

```typescript
const lastUpdate = useRef(0);

useFrame((state, delta) => {
  const now = state.clock.elapsedTime;
  if (now - lastUpdate.current < 0.1) return;  // 10 FPS

  lastUpdate.current = now;
  // Lógica pesada aqui
});
```

### 2. Virtualização

```typescript
// Apenas renderizar entidades perto do player
const visibleEntities = useMemo(() => {
  const playerPos = getPlayerPosition();
  return Object.values(entities).filter(entity => {
    return distance(playerPos, entity.position) < renderDistance;
  });
}, [entities]);
```

### 3. Memoization

```typescript
const expensiveComputation = useMemo(() => {
  return computeExpensive(data);
}, [data]);
```

### 4. useLayoutFrame para Atualizações Síncronas

```typescript
useLayoutFrame(() => {
  // Atualizações que precisam ser síncronas com render
  bodyRef.current?.setTranslation(pos, true);
});
```

## Monitoramento e Debug

### 1. Métricas de Performance

```typescript
export function PerformanceMonitor() {
  const [entityCount, setEntityCount] = useState(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const store = useStore.getState();
      setEntityCount(
        Object.keys(store.enemies).length +
        Object.keys(store.items).length +
        Object.keys(store.obstacles).length
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div>FPS: {fps}</div>
      <div>Entities: {entityCount}</div>
    </div>
  );
}
```

### 2. Visualização de Debug

```typescript
export function DebugVisualizer() {
  const showDebug = useStore((state) => state.showDebug);

  if (!showDebug) return null;

  return (
    <>
      {Object.values(enemies).map(enemy => (
        <Sphere key={enemy.id} position={enemy.position} args={[sightRange]} wireframe>
          <meshBasicMaterial color="red" opacity={0.3} transparent />
        </Sphere>
      ))}
    </>
  );
}
```

## Checklist de Boas Práticas

- [ ] Usar hooks customizados para lógica reutilizável
- [ ] Registra/limpa sistemas no useEffect
- [ ] Usar useMemo/useCallback para performance
- [ ] Evitar setState em useFrame (usar refs)
- [ ] Usar instancing para múltiplas cópias
- [ ] Usar pooling para entidades temporárias
- [ ] Virtualizar entidades distantes
- [ ] Implementar spatial partitioning
- [ ] Monitorar contagem de entidades
- [ ] Testar com 100+ entidades

## Conclusão

Esta arquitetura permite:
- **Escalabilidade**: Suporta 1000+ entidades
- **Performance**: Otimizações em múltiplas camadas
- **Manutenibilidade**: Código organizado e desacoplado
- **Extensibilidade**: Fácil adicionar novos tipos de entidades
- **Testabilidade**: Sistemas isolados são fáceis de testar
