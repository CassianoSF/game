import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { RefObject } from 'react';
import { useRef, useState, useEffect, useMemo } from 'react';
import { useStore } from '../../core/store';

interface CameraControllerProps {
    target: RefObject<any>; // The object to follow (Player RigidBody or Mesh)
}

export function CameraController({ target }: CameraControllerProps) {
    const [rotationAngle, setRotationAngle] = useState(0);
    const [distance, setDistance] = useState(15); // Distance to player (zoomable)
    const [pitch, setPitch] = useState(Math.PI / 3); // Start at ~60 degrees
    const setCameraDragging = useStore((state) => state.setCameraDragging);

    const MIN_DISTANCE = 10;
    const MAX_DISTANCE = 20;

    const MIN_PITCH = 0.4;
    const MAX_PITCH = 1.5;

    const isDragging = useRef(false);
    const desiredPosition = useMemo(() => new Vector3(), []);

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

                setPitch(prev => Math.max(MIN_PITCH, Math.min(MAX_PITCH, prev + deltaY * 0.01)));
            }
        };

        const handleWheel = (e: WheelEvent) => {
            setDistance(prev => {
                const newDistance = prev + e.deltaY * 0.005;
                return Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, newDistance));
            });
        };

        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        document.addEventListener('pointerlockchange', onPointerLockChange);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('wheel', handleWheel);
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
            document.removeEventListener('pointerlockchange', onPointerLockChange);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('wheel', handleWheel);
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

        desiredPosition.set(
            targetPos.x + xOffset,
            targetPos.y + yOffset,
            targetPos.z + zOffset
        );

        state.camera.position.lerp(desiredPosition, 0.1);
        state.camera.lookAt(targetPos.x, targetPos.y, targetPos.z);
    });

    return null;
}
