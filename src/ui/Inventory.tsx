import { useStore } from '../core/store';

export function Inventory({ onClose }: { onClose: () => void }) {
    const inventory = useStore((state) => state.inventory);
    const moveItem = useStore((state) => state.moveItem);

    const handleDragStart = (e: React.DragEvent, slot: number) => {
        e.dataTransfer.setData('fromContainer', 'inventory');
        e.dataTransfer.setData('fromSlot', slot.toString());
    };

    const handleDrop = (e: React.DragEvent, slot: number) => {
        e.preventDefault();
        const fromContainer = e.dataTransfer.getData('fromContainer') as 'inventory' | 'hotbar';
        const fromSlot = parseInt(e.dataTransfer.getData('fromSlot'));

        if (fromContainer && !isNaN(fromSlot)) {
            moveItem(fromContainer, fromSlot, 'inventory', slot);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px', // Wider implementation for 5x4 grid
            background: 'rgba(20, 20, 30, 0.9)',
            border: '2px solid #555',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            color: 'white'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Inventory</h2>
                <button onClick={onClose} style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: 'white', fontSize: '18px' }}>X</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {inventory.map((item, index) => (
                    <div
                        key={index}
                        draggable={!!item}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragOver={handleDragOver}
                        style={{
                            width: '80px',
                            height: '80px',
                            background: item ? '#333' : '#222',
                            border: '1px solid #555',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: item ? 'grab' : 'default',
                            fontSize: '12px',
                            textAlign: 'center'
                        }}
                    >
                        {item && (
                            <>
                                <div style={{ width: '20px', height: '20px', background: item.stats.color, borderRadius: '50%', marginBottom: '5px' }} />
                                {item.name}
                            </>
                        )}
                    </div>
                ))}
            </div>

            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>Drag items to swap or move.</p>
        </div>
    );
}
