import { useStore } from '../core/store';
import { useInventoryDragDrop } from './hooks/useInventoryDragDrop';

export function Hotbar() {
    const hotbar = useStore((state) => state.hotbar);
    const activeSlot = useStore((state) => state.activeSlot);
    const setActiveSlot = useStore((state) => state.setActiveSlot);
    const moveItem = useStore((state) => state.moveItem);

    const { handleDragStart, handleDrop, handleDragOver } = useInventoryDragDrop({
        container: 'hotbar',
        moveItem,
    });

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(0,0,0,0.5)',
            padding: '10px',
            borderRadius: '10px',
            pointerEvents: 'auto'
        }}>
            {hotbar.map((item, index) => (
                <div
                    key={index}
                    draggable={!!item}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    onClick={() => setActiveSlot(index)}
                    style={{
                        width: '60px',
                        height: '60px',
                        border: activeSlot === index ? '3px solid white' : '1px solid gray',
                        background: item ? item.stats.color : 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'gray',
                        fontSize: '12px',
                        cursor: item ? 'grab' : 'default',
                        userSelect: 'none',
                        textAlign: 'center'
                    }}
                >
                    {item ? item.name : `${(index + 1) % 10}`}
                </div>
            ))}
        </div>
    );
}
