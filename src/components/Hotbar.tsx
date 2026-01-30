import { useStore } from '../store';

export function Hotbar() {
    const hotbar = useStore((state) => state.hotbar);
    const activeSlot = useStore((state) => state.activeSlot);
    const setActiveSlot = useStore((state) => state.setActiveSlot);
    const moveItem = useStore((state) => state.moveItem);

    const handleDragStart = (e: React.DragEvent, slot: number) => {
        // Drag from hotbar
        e.dataTransfer.setData('fromContainer', 'hotbar');
        e.dataTransfer.setData('fromSlot', slot.toString());
    };

    const handleDrop = (e: React.DragEvent, slot: number) => {
        e.preventDefault();
        const fromContainer = e.dataTransfer.getData('fromContainer') as 'inventory' | 'hotbar';
        const fromSlot = parseInt(e.dataTransfer.getData('fromSlot'));

        if (fromContainer && !isNaN(fromSlot)) {
            moveItem(fromContainer, fromSlot, 'hotbar', slot);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

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
                        color: 'white',
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
