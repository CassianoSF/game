import { RigidBody } from '@react-three/rapier';
import { useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { Enemy } from './Enemy';
import { createNoise2D } from 'simplex-noise';

export function Level() {
    const enemies = useStore((state) => state.enemies);
    const addEnemy = useStore((state) => state.addEnemy);

    // Procedural Box Generation
    const boxes = useMemo(() => {
        const noise2D = createNoise2D();
        const generatedBoxes = [];
        const size = 80; // Map size
        const scale = 0.1; // Noise scale

        for (let x = -size / 2; x < size / 2; x += 2) {
            for (let z = -size / 2; z < size / 2; z += 2) {
                // Formatting noise to 0-1 range roughly
                const n = noise2D(x * scale, z * scale);

                // Threshold for creating a box
                if (n > 0.3) {
                    // Stack height based on noise
                    const height = Math.floor((n - 0.3) * 5) + 1;

                    for (let h = 0; h < height; h++) {
                        generatedBoxes.push({
                            id: `box-${x}-${z}-${h}`,
                            position: [x, 1 + h * 2, z] as [number, number, number],
                            args: [2, 2, 2] as [number, number, number]
                        });
                    }
                }
            }
        }
        return generatedBoxes;
    }, []);

    useEffect(() => {
        // Spawn initial enemies in groups
        if (useStore.getState().enemies.length === 0) {
            const groups = 8; // More groups for bigger map
            const enemiesPerGroup = 4;

            for (let g = 0; g < groups; g++) {
                // Random center for the group
                const centerX = (Math.random() - 0.5) * 80; // Increased range
                const centerZ = (Math.random() - 0.5) * 80;

                for (let i = 0; i < enemiesPerGroup; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 2 + Math.random() * 3;

                    addEnemy({
                        id: crypto.randomUUID(),
                        position: [
                            centerX + Math.cos(angle) * radius,
                            1,
                            centerZ + Math.sin(angle) * radius
                        ],
                        hp: 100
                    });
                }
            }
        }
    }, [addEnemy]);

    return (
        <>
            {/* Dynamic Obstacles */}
            {boxes.map((box) => (
                <RigidBody
                    key={box.id}
                    position={box.position}
                    colliders="cuboid"
                    friction={1}
                    restitution={0}
                    type="dynamic" // Movable
                    density={10}   // Heavy
                    linearDamping={0.5}
                    angularDamping={0.5}
                >
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={box.args} />
                        <meshStandardMaterial color="#888" />
                    </mesh>
                </RigidBody>
            ))}

            {/* Enemies */}
            {enemies.map(e => (
                <Enemy key={e.id} data={e} />
            ))}
        </>
    )
}
