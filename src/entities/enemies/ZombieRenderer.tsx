import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import meta from '../../../public/models/VAT_Meta.json';

// Global reference for enemies to update their visual instance
export const zombieRendererAPI = {
    instancedMesh: null as THREE.InstancedMesh | null,
    frameAttribute: null as THREE.InstancedBufferAttribute | null,
    register: () => {
        // Find a free slot (simple counter for now)
        zombieRendererAPI.count++;
        return zombieRendererAPI.count - 1;
    },
    unregister: (slot: number) => {
        // Logic to free slot (can be implemented later for true pooling)
        if (zombieRendererAPI.instancedMesh) {
            // Hide it
            const mat = new THREE.Matrix4();
            mat.makeScale(0, 0, 0);
            zombieRendererAPI.instancedMesh.setMatrixAt(slot, mat);
            zombieRendererAPI.instancedMesh.instanceMatrix.needsUpdate = true;
        }
    },
    count: 0,
};

// Limite máximo de zumbis renderizados. Fique à vontade para aumentar!
// A GPU aguenta milhares, mas a Física (Rapier) pode começar a pesar o CPU depois de 500+.
const MAX_ZOMBIES = 500;

export function ZombieRenderer() {
    const { scene } = useGLTF('/models/VAT_StaticMesh.glb');

    // Use Suspense loader to block the Loading Screen until the 300MB file is fully loaded into RAM
    const buffer = useLoader(THREE.FileLoader, '/models/VAT_Data.bin', (loader) => {
        loader.setResponseType('arraybuffer');
    }) as ArrayBuffer;

    const vatTexture = useMemo(() => {
        const data = new Float32Array(buffer);
        // Texture dimensions: Width = vertices, Height = frames (from Meta)
        const texture = new THREE.DataTexture(
            data, 
            meta.vertices, 
            meta.frames, 
            THREE.RGBAFormat, 
            THREE.FloatType
        );
        texture.internalFormat = 'RGBA32F';
        texture.needsUpdate = true;
        return texture;
    }, [buffer]);

    const uniformsData = useMemo(() => ({
        vatTexture: { value: vatTexture },
        numFrames: { value: meta.frames }
    }), [vatTexture]);

    // Find the actual mesh inside the GLTF
    const staticMesh = useMemo<THREE.Mesh | null>(() => {
        let found: THREE.Mesh | null = null;
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && !found) found = child;
        });
        return found;
    }, [scene]);

    const geometry = useMemo(() => {
        if (!staticMesh) return null;
        return staticMesh.geometry.clone();
    }, [staticMesh]);

    const frameArray = useMemo(() => new Float32Array(MAX_ZOMBIES), []);

    const material = useMemo(() => {
        if (!staticMesh || !vatTexture) return null;
        const mat = Array.isArray(staticMesh.material) ? staticMesh.material[0] : staticMesh.material;
        const matClone = mat.clone() as THREE.Material;

        matClone.onBeforeCompile = (shader) => {
            shader.uniforms.vatTexture = uniformsData.vatTexture;
            shader.uniforms.numFrames = uniformsData.numFrames;

            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `
                #include <common>
                uniform sampler2D vatTexture;
                uniform float numFrames;
                attribute float aFrame;
                #ifndef USE_UV2
                  attribute vec2 uv2;
                #endif
                `
            ).replace(
                `#include <begin_vertex>`,
                `
                // Read VAT Pixel
                float u = uv2.x;
                float v = (aFrame + 0.5) / numFrames;
                vec4 texPos = texture2D(vatTexture, vec2(u, v));
                vec3 transformed = texPos.xyz;
                `
            );
        };
        return matClone;
    }, [staticMesh, vatTexture, uniformsData]);

    const customDepthMaterial = useMemo(() => {
        if (!vatTexture) return null;
        const depthMat = new THREE.MeshDepthMaterial();
        depthMat.onBeforeCompile = (shader) => {
            shader.uniforms.vatTexture = uniformsData.vatTexture;
            shader.uniforms.numFrames = uniformsData.numFrames;

            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `
                #include <common>
                uniform sampler2D vatTexture;
                uniform float numFrames;
                attribute float aFrame;
                #ifndef USE_UV2
                  attribute vec2 uv2;
                #endif
                `
            ).replace(
                `#include <begin_vertex>`,
                `
                // Read VAT Pixel
                float u = uv2.x;
                float v = (aFrame + 0.5) / numFrames;
                vec4 texPos = texture2D(vatTexture, vec2(u, v));
                vec3 transformed = texPos.xyz;
                `
            );
        };
        return depthMat;
    }, [vatTexture, uniformsData]);

    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const frameAttributeRef = useRef<THREE.InstancedBufferAttribute>(null);

    React.useEffect(() => {
        if (instancedMeshRef.current && frameAttributeRef.current) {
            zombieRendererAPI.instancedMesh = instancedMeshRef.current;
            zombieRendererAPI.frameAttribute = frameAttributeRef.current;
            // Initialize all matrices to zero scale to hide them
            const emptyMat = new THREE.Matrix4().makeScale(0, 0, 0);
            for (let i = 0; i < MAX_ZOMBIES; i++) {
                instancedMeshRef.current.setMatrixAt(i, emptyMat);
            }
            instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [geometry, material]);

    if (!geometry || !material || !vatTexture) return null;

    return (
        <instancedMesh
            ref={instancedMeshRef}
            args={[geometry, material, MAX_ZOMBIES]}
            customDepthMaterial={customDepthMaterial || undefined}
            frustumCulled={false} // VAT modifies bounds, best to disable frustum culling
            castShadow
            receiveShadow
        >
            <instancedBufferAttribute 
                ref={frameAttributeRef}
                attach="geometry-attributes-aFrame" 
                args={[frameArray, 1]} 
                usage={THREE.DynamicDrawUsage}
            />
        </instancedMesh>
    );
}
