import { useCallback } from 'react';
import type { ContainerType, InventorySlot } from '../../core/config/types';

interface UseInventoryDragDropParams {
  container: ContainerType;
  moveItem: (fromContainer: ContainerType, fromSlot: InventorySlot, toContainer: ContainerType, toSlot: InventorySlot) => void;
}

interface DragDropHandlers {
  handleDragStart: (e: React.DragEvent, slot: InventorySlot) => void;
  handleDrop: (e: React.DragEvent, slot: InventorySlot) => void;
  handleDragOver: (e: React.DragEvent) => void;
}

export function useInventoryDragDrop({ container, moveItem }: UseInventoryDragDropParams): DragDropHandlers {
  const handleDragStart = useCallback((e: React.DragEvent, slot: InventorySlot) => {
    e.dataTransfer.setData('fromContainer', container);
    e.dataTransfer.setData('fromSlot', slot.toString());
  }, [container]);

  const handleDrop = useCallback((e: React.DragEvent, slot: InventorySlot) => {
    e.preventDefault();
    
    const fromContainer = e.dataTransfer.getData('fromContainer') as ContainerType;
    const fromSlot = parseInt(e.dataTransfer.getData('fromSlot'), 10);

    if (fromContainer && !isNaN(fromSlot)) {
      moveItem(fromContainer, fromSlot, container, slot);
    }
  }, [container, moveItem]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return {
    handleDragStart,
    handleDrop,
    handleDragOver,
  };
}
