import { useEffect, useState } from 'react';
import { useStore } from '../core/store';

export function Cursor() {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false); // Hide until first move to avoid (0,0) glitch

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!useStore.getState().isCameraDragging) {
                setPos({ x: e.clientX, y: e.clientY });
            }
            if (!isVisible) setIsVisible(true);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
                width: '20px',
                height: '20px',
                border: '2px solid white',
                borderRadius: '50%',
                pointerEvents: 'none',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mixBlendMode: 'difference' // Make it visible on all backgrounds
            }}
        >
            <div style={{ width: '4px', height: '4px', background: 'cyan', borderRadius: '50%' }} />
        </div>
    );
}
