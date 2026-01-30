import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { RefObject } from 'react';
import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';

interface CameraControllerProps {
    target: RefObject<any>; // The object to follow (Player RigidBody or Mesh)
}

export function CameraController({ target }: CameraControllerProps) {
    const [rotationAngle, setRotationAngle] = useState(0);
    const [distance] = useState(45); // Fixed absolute distance to player
    const [pitch, setPitch] = useState(Math.PI / 3); // Start at ~60 degrees
    const setCameraDragging = useStore((state) => state.setCameraDragging);

    const isDragging = useRef(false);

    useEffect(() => {
        const onPointerLockChange = () => {
            const isLocked = document.pointerLockElement === document.body;
            isDragging.current = isLocked;
            setCameraDragging(isLocked);
        };

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 2) { // Right click
                document.body.requestPointerLock();
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 2) {
                document.exitPointerLock();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current) {
                const deltaX = e.movementX;
                const deltaY = e.movementY;

                setRotationAngle(prev => prev - deltaX * 0.002);

                // Pitch control (Vertical Angle)
                // 0 radians = horizon (flat), PI/2 = directly overhead
                // Clamp to keep camera high enough. 
                // Min height 12 with Dist 25 => sin(angle) >= 12/25 = 0.48 => ~0.5 radians (approx 28 deg)
                // Let's safe clamp between 0.6 (~35 deg) and 1.5 (~85 deg)
                setPitch(prev => Math.max(0.6, Math.min(1.5, prev + deltaY * 0.002)));
            }
        };

        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        document.addEventListener('pointerlockchange', onPointerLockChange);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('pointerlockchange', onPointerLockChange);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('contextmenu', handleContextMenu);
        };
    }, []);

    useFrame((state) => {
        if (!target.current) return;

        // Get target position
        const targetPos = target.current.translation ? target.current.translation() : target.current.position;

        // Spherical Coordinates
        // y = distance * sin(pitch)
        // horizontal_radius = distance * cos(pitch)

        const yOffset = distance * Math.sin(pitch);
        const hOffset = distance * Math.cos(pitch);

        const xOffset = Math.sin(rotationAngle) * hOffset;
        const zOffset = Math.cos(rotationAngle) * hOffset;

        const desiredPosition = new Vector3(
            targetPos.x + xOffset,
            targetPos.y + yOffset,
            targetPos.z + zOffset
        );

        state.camera.position.lerp(desiredPosition, 0.1);
        state.camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    });

    return null;
}
