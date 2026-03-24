import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_PARTICLES = 3000;

export const particleAPI = {
    currentIndex: 0,
    instancedMesh: null as THREE.InstancedMesh | null,
    velocityAttr: null as THREE.InstancedBufferAttribute | null,
    startTimeAttr: null as THREE.InstancedBufferAttribute | null,
    durationAttr: null as THREE.InstancedBufferAttribute | null,
    colorAttr: null as THREE.InstancedBufferAttribute | null,
    sizeAttr: null as THREE.InstancedBufferAttribute | null,

    emit: (position: { x: number, y: number, z: number }, type: 'blood' | 'spark' | 'muzzle', count: number = 10, direction?: { x: number, y: number, z: number }) => {
        if (!particleAPI.instancedMesh || !particleAPI.velocityAttr || !particleAPI.startTimeAttr || !particleAPI.durationAttr || !particleAPI.colorAttr || !particleAPI.sizeAttr) return;

        const time = performance.now() / 1000;
        const dummy = new THREE.Matrix4();
        dummy.makeTranslation(position.x, position.y, position.z);

        const color = new THREE.Color();
        if (type === 'blood') {
            color.setHex(0x990000);
        } else if (type === 'muzzle') {
            color.setHex(0xffffff); // starts white-hot, shifts to orange in color jitter
        } else {
            color.setHex(0xffaa00);
        }

        for (let i = 0; i < count; i++) {
            const idx = particleAPI.currentIndex;
            particleAPI.currentIndex = (particleAPI.currentIndex + 1) % MAX_PARTICLES;

            particleAPI.instancedMesh.setMatrixAt(idx, dummy);

            let vx, vy, vz;
            if (type === 'muzzle' && direction) {
                const coneSpread = 4;
                const fwdSpeed = 8 + Math.random() * 6;
                vx = direction.x * fwdSpeed + (Math.random() - 0.5) * coneSpread;
                vy = direction.y * fwdSpeed + (Math.random() - 0.5) * coneSpread;
                vz = direction.z * fwdSpeed + (Math.random() - 0.5) * coneSpread;
            } else if (type === 'blood' && direction) {
                const coneSpread = 3;
                const fwdSpeed = 10 + Math.random() * 6;
                vx = direction.x * fwdSpeed + (Math.random() - 0.5) * coneSpread;
                vy = direction.y * fwdSpeed + (Math.random() - 0.5) * coneSpread;
                vz = direction.z * fwdSpeed + (Math.random() - 0.5) * coneSpread;
            } else {
                const spread = type === 'spark' ? 12 : 5;
                const upForce = type === 'spark' ? 8 : 4;
                vx = (Math.random() - 0.5) * spread;
                vy = Math.random() * upForce + (type === 'spark' ? 2 : 1);
                vz = (Math.random() - 0.5) * spread;
            }

            particleAPI.velocityAttr.setXYZ(idx, vx, vy, vz);
            particleAPI.startTimeAttr.setX(idx, time);

            // Muzzle flash is very brief (0.08-0.12s)
            if (type === 'muzzle') {
                particleAPI.durationAttr.setX(idx, 0.06 + Math.random() * 0.06);
            } else {
                particleAPI.durationAttr.setX(idx, type === 'blood' ? 0.2 + Math.random() * 0.15 : 0.2 + Math.random() * 0.2);
            }

            if (type === 'muzzle') {
                const heat = Math.random();
                particleAPI.colorAttr.setXYZ(idx, 1.0, heat * 0.8 + 0.2, heat < 0.4 ? 0.0 : heat * 0.3);
            } else if (type === 'blood') {
                const rOffset = (Math.random() - 0.5) * 0.1;
                particleAPI.colorAttr.setXYZ(idx, Math.min(1, color.r + rOffset), Math.max(0, color.g + rOffset), Math.min(1, color.b + rOffset));
            } else {
                const rOffset = (Math.random() - 0.5) * 0.1;
                particleAPI.colorAttr.setXYZ(idx, Math.min(1, color.r + rOffset), Math.max(0, color.g + rOffset), Math.min(1, color.b + rOffset));
            }

            if (type === 'blood') {
                particleAPI.sizeAttr.setX(idx, 0.9);
            } else if (type === 'spark') {
                particleAPI.sizeAttr.setX(idx, 0.4);
            } else {
                particleAPI.sizeAttr.setX(idx, 1.0);
            }
        }

        particleAPI.instancedMesh.instanceMatrix.needsUpdate = true;
        particleAPI.velocityAttr.needsUpdate = true;
        particleAPI.startTimeAttr.needsUpdate = true;
        particleAPI.durationAttr.needsUpdate = true;
        particleAPI.colorAttr.needsUpdate = true;
        particleAPI.sizeAttr.needsUpdate = true;
    }
}

export function ParticleSystem() {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const velRef = useRef<THREE.InstancedBufferAttribute>(null);
    const startRef = useRef<THREE.InstancedBufferAttribute>(null);
    const durRef = useRef<THREE.InstancedBufferAttribute>(null);
    const colRef = useRef<THREE.InstancedBufferAttribute>(null);
    const sizeRef = useRef<THREE.InstancedBufferAttribute>(null);

    const [velArray] = React.useState(() => new Float32Array(MAX_PARTICLES * 3));
    const [startArray] = React.useState(() => new Float32Array(MAX_PARTICLES).fill(-9999));
    const [durArray] = React.useState(() => new Float32Array(MAX_PARTICLES).fill(0));
    const [colArray] = React.useState(() => new Float32Array(MAX_PARTICLES * 3).fill(1));
    const [sizeArray] = React.useState(() => new Float32Array(MAX_PARTICLES).fill(1));

    const uniformsData = useMemo(() => ({
        uTime: { value: performance.now() / 1000 }
    }), []);

    useEffect(() => {
        if (meshRef.current && velRef.current && startRef.current && durRef.current && colRef.current && sizeRef.current) {
            particleAPI.instancedMesh = meshRef.current;
            particleAPI.velocityAttr = velRef.current;
            particleAPI.startTimeAttr = startRef.current;
            particleAPI.durationAttr = durRef.current;
            particleAPI.colorAttr = colRef.current;
            particleAPI.sizeAttr = sizeRef.current;

            // Initialize matrices off-screen/zero scale so they are invisible at birth
            const emptyMat = new THREE.Matrix4().makeScale(0, 0, 0);
            for (let i = 0; i < MAX_PARTICLES; i++) {
                meshRef.current.setMatrixAt(i, emptyMat);
            }
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, []);

    useFrame(() => {
        uniformsData.uTime.value = performance.now() / 1000;
    });

    const material = useMemo(() => {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide });
        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = uniformsData.uTime;

            shader.vertexShader = shader.vertexShader.replace(
                `#include <common>`,
                `
                #include <common>
                uniform float uTime;
                attribute vec3 aVelocity;
                attribute float aStartTime;
                attribute float aDuration;
                attribute vec3 aColor;
                attribute float aSize;

                varying vec3 vParticleColor;
                varying float vAlpha;
                `
            ).replace(
                `#include <begin_vertex>`,
                `
                float t = uTime - aStartTime;
                float scale = 0.0;
                vec3 physicsOffset = vec3(0.0);

                // If particle is alive according to its mathematical clock
                if (t >= 0.0 && t <= aDuration) {
                    scale = (1.0 - (t / aDuration)) * aSize;
                    
                    // Fixed mathematical parabolic physics for gravity
                    vec3 gravity = vec3(0.0, -15.81, 0.0);
                    physicsOffset = aVelocity * t + 0.5 * gravity * t * t;
                }
                
                vec3 transformed = vec3( position ) * scale + physicsOffset;
                
                vParticleColor = aColor;
                vAlpha = scale;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <common>`,
                `
                #include <common>
                varying vec3 vParticleColor;
                varying float vAlpha;
                `
            ).replace(
                `vec4 diffuseColor = vec4( diffuse, opacity );`,
                `
                // Overwrite normal color and opacity
                vec4 diffuseColor = vec4(vParticleColor, vAlpha);
                if (vAlpha <= 0.01) discard; // Hard cull dead particles for GPU speed
                `
            );
        }
        return mat;
    }, [uniformsData]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, material, MAX_PARTICLES]} frustumCulled={false}>
            {/* Simple retro squarish dots */}
            <planeGeometry args={[0.2, 0.2]} />
            <instancedBufferAttribute ref={velRef} attach="geometry-attributes-aVelocity" args={[velArray, 3]} usage={THREE.DynamicDrawUsage} />
            <instancedBufferAttribute ref={startRef} attach="geometry-attributes-aStartTime" args={[startArray, 1]} usage={THREE.DynamicDrawUsage} />
            <instancedBufferAttribute ref={durRef} attach="geometry-attributes-aDuration" args={[durArray, 1]} usage={THREE.DynamicDrawUsage} />
            <instancedBufferAttribute ref={colRef} attach="geometry-attributes-aColor" args={[colArray, 3]} usage={THREE.DynamicDrawUsage} />
            <instancedBufferAttribute ref={sizeRef} attach="geometry-attributes-aSize" args={[sizeArray, 1]} usage={THREE.DynamicDrawUsage} />
        </instancedMesh>
    );
}
