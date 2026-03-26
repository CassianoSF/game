export function MainMenu() {
    const setGameState = (state: 'playing' | 'paused' | 'menu') => {
        (window as any).__setGameState?.(state);
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            zIndex: 1000,
            pointerEvents: 'auto'
        }}>
            <h1 style={{
                color: '#e94560',
                fontSize: '72px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textShadow: '0 0 20px #e94560, 0 0 40px #e94560',
                marginBottom: '60px',
                letterSpacing: '8px',
                animation: 'pulse 2s infinite'
            }}>
                ZOMBIE SURVIVAL
            </h1>

            <button
                onClick={() => setGameState('playing')}
                style={{
                    padding: '20px 80px',
                    fontSize: '24px',
                    fontFamily: 'monospace',
                    background: 'linear-gradient(135deg, #e94560 0%, #c73e54 100%)',
                    color: 'white',
                    border: '3px solid #ff6b6b',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    letterSpacing: '4px',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px rgba(0,0,0,0.5)',
                    boxShadow: '0 8px 32px rgba(233, 69, 96, 0.4)',
                    transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(233, 69, 96, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(233, 69, 96, 0.4)';
                }}
            >
                JOGAR
            </button>

            <div style={{
                marginTop: '40px',
                color: '#888',
                fontFamily: 'monospace',
                fontSize: '14px'
            }}>
                Aperte ESC para pausar durante o jogo
            </div>
        </div>
    );
}
