import { useEffect } from 'react';
import { addEffect } from '@react-three/fiber';
import { useStore } from '../core/store';
import { Inventory } from './Inventory';
import { Hotbar } from './Hotbar';
import { useState, useCallback } from 'react';

export function UI() {
    const [showInventory, setShowInventory] = useState(false);
    const setActiveSlot = useCallback((slot: number) => useStore.getState().setActiveSlot(slot), []);

    useEffect(() => {
        let frameCount = 0;
        let lastTime = performance.now();
        const fpsElement = document.getElementById('fps-counter');

        const unsub = addEffect(() => {
            frameCount++;
            const time = performance.now();
            if (time >= lastTime + 1000) {
                if (fpsElement) {
                    fpsElement.innerText = `FPS: ${Math.round((frameCount * 1000) / (time - lastTime))}`;
                }
                frameCount = 0;
                lastTime = time;
            }
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                setShowInventory(prev => !prev);
            }
            if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
                let slot = parseInt(e.key) - 1;
                if (e.key === '0') slot = 9;
                setActiveSlot(slot);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            unsub();
        };
    }, []);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none', // Pass clicks through to Canvas by default
            zIndex: 10
        }}>
            <Hotbar />
            {showInventory && <Inventory onClose={() => setShowInventory(false)} />}

            {/* Instruction Tip */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                color: 'white',
                background: 'rgba(0,0,0,0.5)',
                padding: '10px',
                borderRadius: '5px',
                fontFamily: 'monospace'
            }}>
                TAB: Inventory | 1-4: Equip
            </div>

            {/* FPS Counter */}
            <div id="fps-counter" style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                color: 'lime',
                background: 'rgba(0,0,0,0.5)',
                padding: '5px 10px',
                borderRadius: '5px',
                fontFamily: 'monospace',
                fontWeight: 'bold'
            }}>
                FPS: --
            </div>
            {/* Level Selection */}
            <div style={{
                position: 'absolute',
                top: '60px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                pointerEvents: 'auto' // Allow clicking buttons
            }}>
                <button onClick={() => useStore.getState().setLevel('procedural')} style={{ cursor: 'pointer', padding: '5px' }}>
                    Procedural Level
                </button>
                <button onClick={() => useStore.getState().setLevel('simple')} style={{ cursor: 'pointer', padding: '5px' }}>
                    Duel Level
                </button>
                <button onClick={() => {
                    const x = (Math.random() - 0.5) * 10;
                    const z = (Math.random() - 0.5) * 10;
                    useStore.getState().addEnemy({
                        id: crypto.randomUUID(),
                        position: [x, 5, z], // Drop from height
                        hp: 100,
                        modelPath: '/models/Zombiegirl.glb'
                    });
                }} style={{ cursor: 'pointer', padding: '5px', marginTop: '10px', background: '#e44' }}>
                    Spawn Enemy
                </button>
                <button onClick={() => {
                    const x = (Math.random() - 0.5) * 10;
                    const z = (Math.random() - 0.5) * 10;
                    const scale = 0.25 + Math.random() * 0.75; // 0.25 a 1.0
                    useStore.getState().addObstacle({
                        id: crypto.randomUUID(),
                        position: [x, 5, z],
                        scale: [scale, scale, scale],
                    });
                }} style={{ cursor: 'pointer', padding: '5px', marginTop: '10px', background: '#aaa' }}>
                    Spawn Obstacle
                </button>
            </div>
        </div>
    );
}
