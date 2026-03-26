export function PauseMenu() {
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
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            pointerEvents: 'auto'
        }}>
            <h1 style={{
                color: '#e94560',
                fontSize: '64px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textShadow: '0 0 20px #e94560, 0 0 40px #e94560',
                marginBottom: '40px',
                letterSpacing: '8px'
            }}>
                PAUSADO
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                    CONTINUAR
                </button>

                <button
                    onClick={() => setGameState('menu')}
                    style={{
                        padding: '20px 80px',
                        fontSize: '24px',
                        fontFamily: 'monospace',
                        background: 'linear-gradient(135deg, #666 0%, #444 100%)',
                        color: 'white',
                        border: '3px solid #888',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        letterSpacing: '4px',
                        fontWeight: 'bold',
                        textShadow: '0 0 10px rgba(0,0,0,0.5)',
                        boxShadow: '0 8px 32px rgba(100, 100, 100, 0.4)',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 12px 40px rgba(100, 100, 100, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(100, 100, 100, 0.4)';
                    }}
                >
                    MENU PRINCIPAL
                </button>
            </div>

            <div style={{
                marginTop: '40px',
                color: '#888',
                fontFamily: 'monospace',
                fontSize: '14px'
            }}>
                Pressione ESC para continuar
            </div>
        </div>
    );
}
