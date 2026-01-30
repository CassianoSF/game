import { useEffect } from 'react';
import { useStore } from '../store';
import { Inventory } from './Inventory';
import { Hotbar } from './Hotbar';
import { useState } from 'react';

export function UI() {
    const [showInventory, setShowInventory] = useState(false);
    const setActiveSlot = useStore((state) => state.setActiveSlot);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // console.log('Key pressed:', e.key); 
            if (e.key === 'Tab') {
                e.preventDefault();
                setShowInventory(prev => !prev);
            }
            if (['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
                let slot = parseInt(e.key) - 1;
                if (e.key === '0') slot = 9;
                console.log('Setting active slot:', slot);
                setActiveSlot(slot);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
        </div>
    );
}
