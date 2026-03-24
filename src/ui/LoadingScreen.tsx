import { useProgress } from '@react-three/drei';
import { useState, useEffect } from 'react';

export function LoadingScreen() {
    const { active, progress, item, loaded, total } = useProgress();
    const [hidden, setHidden] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (!active && progress === 100) {
            // Fade out smoothly to mask shader compilation
            const t1 = setTimeout(() => setFadeOut(true), 500); 
            const t2 = setTimeout(() => setHidden(true), 1500); 
            return () => { clearTimeout(t1); clearTimeout(t2); }
        } else if (active) {
            setHidden(false);
            setFadeOut(false);
        }
    }, [active, progress]);

    if (hidden) return null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#111',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity 1s ease',
            opacity: fadeOut ? 0 : 1,
            pointerEvents: 'none',
            color: 'white',
            fontFamily: 'monospace'
        }}>
            <h1 style={{ marginBottom: 20 }}>ENGAGED ENGINE</h1>
            <div style={{
                width: '300px',
                height: '10px',
                backgroundColor: '#333',
                borderRadius: '5px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: 'lime',
                    transition: 'width 0.1s ease'
                }} />
            </div>
            <div style={{ marginTop: 10, color: '#aaa' }}>
                {Math.round(progress)}% ({loaded}/{total})
            </div>
            {item && (
                <div style={{ marginTop: 5, fontSize: '10px', color: '#666', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Loading: {item}
                </div>
            )}
        </div>
    );
}
