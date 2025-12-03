import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleTemplate } from '../types';

interface ParticleVisualizerProps {
  template: ParticleTemplate;
  tension: number;
  color: string;
}

const COUNT = 3000;
const DUMMY = new THREE.Object3D();

// Math helpers for shapes
const getPointOnSphere = (i: number, n: number, r: number = 1) => {
  const phi = Math.acos(-1 + (2 * i) / n);
  const theta = Math.sqrt(n * Math.PI) * phi;
  return new THREE.Vector3(
    r * Math.cos(theta) * Math.sin(phi),
    r * Math.sin(theta) * Math.sin(phi),
    r * Math.cos(phi)
  );
};

const getPointOnHeart = (t: number) => {
  // Parametric heart
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  const z = 0; 
  // Extrude slightly for 3D
  return new THREE.Vector3(x * 0.1, y * 0.1, z);
};

const getPointOnFlower = (t: number, k: number = 4) => {
  // Rose curve (polar to cartesian)
  const r = Math.cos(k * t);
  const x = r * Math.cos(t);
  const y = r * Math.sin(t);
  return new THREE.Vector3(x * 2, y * 2, 0);
};

const getMeditatingShape = (i: number, total: number) => {
    // Abstract seated figure using spheres
    // Head: top 10%
    // Torso: middle 40%
    // Legs: bottom 50%
    const yNorm = i / total;
    let pos = new THREE.Vector3();
    
    if (yNorm > 0.85) { // Head
        const pt = getPointOnSphere(i, total * 0.15, 0.4);
        pos.copy(pt).add(new THREE.Vector3(0, 1.2, 0));
    } else if (yNorm > 0.4) { // Torso
        const pt = getPointOnSphere(i, total * 0.45, 0.6);
        pos.copy(pt).setY(pt.y * 1.5); // Elongate slightly
    } else { // Legs (Base)
         const angle = (i / (total * 0.4)) * Math.PI * 2;
         const r = 1.0 + Math.random() * 0.2;
         pos.set(Math.cos(angle) * r, -0.8 + (Math.random() - 0.5) * 0.5, Math.sin(angle) * r);
    }
    return pos;
};

export const ParticleVisualizer: React.FC<ParticleVisualizerProps> = ({ template, tension, color }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const targetPositions = useMemo(() => new Float32Array(COUNT * 3), []);
  const currentPositions = useRef(new Float32Array(COUNT * 3));
  const speeds = useMemo(() => new Float32Array(COUNT).map(() => 0.02 + Math.random() * 0.05), []);

  // Calculate target positions based on template
  useEffect(() => {
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      let x = 0, y = 0, z = 0;

      switch (template) {
        case ParticleTemplate.SPHERE:
          tempVec.copy(getPointOnSphere(i, COUNT, 2));
          break;
        case ParticleTemplate.HEART: {
          // Spread points along t from 0 to 2PI multiple times to fill volume
          const t = (i / COUNT) * Math.PI * 20; 
          const heartP = getPointOnHeart(t);
          // Add some random noise for volume
          tempVec.copy(heartP).add(new THREE.Vector3((Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5, (Math.random()-0.5)*0.5));
          break;
        }
        case ParticleTemplate.FLOWER: {
            const t = (i / COUNT) * Math.PI * 20;
            const flowerP = getPointOnFlower(t, 5);
             // 3D rotation to make it look like a bouquet or volume
            tempVec.copy(flowerP);
            const rotZ = (Math.random() - 0.5) * 2;
            tempVec.z = rotZ;
            break;
        }
        case ParticleTemplate.SATURN: {
            if (i < COUNT * 0.7) {
                // Planet
                tempVec.copy(getPointOnSphere(i, COUNT * 0.7, 1.2));
            } else {
                // Ring
                const angle = ((i - COUNT * 0.7) / (COUNT * 0.3)) * Math.PI * 2;
                const r = 2.0 + Math.random() * 0.8;
                tempVec.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
                // Tilt ring
                tempVec.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
            }
            break;
        }
        case ParticleTemplate.BUDDHA: {
            tempVec.copy(getMeditatingShape(i, COUNT));
            break;
        }
        case ParticleTemplate.FIREWORKS: {
             const t = Math.random() * Math.PI * 2;
             const phi = Math.random() * Math.PI;
             const r = 0.1; // Start small
             tempVec.set(r * Math.sin(phi) * Math.cos(t), r * Math.sin(phi) * Math.sin(t), r * Math.cos(phi));
             break;
        }
        default:
          tempVec.set(0, 0, 0);
      }
      
      targetPositions[i * 3] = tempVec.x;
      targetPositions[i * 3 + 1] = tempVec.y;
      targetPositions[i * 3 + 2] = tempVec.z;
    }
  }, [template, targetPositions]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Lerp smoothing factor for tension
    // When tension is 1 (fist), particles bunch up tight (scale down or attract to center)
    // When tension is 0 (open), particles expand to their target shape + some breathing
    
    // We map tension to an "expansion" factor.
    // Tension 1.0 -> Expansion 0.2 (Tight ball)
    // Tension 0.0 -> Expansion 1.5 (Exploded/Wide)
    const expansion = 1.8 - (tension * 1.6); // 1.8 to 0.2
    
    // Color handling
    const colorObj = new THREE.Color(color);

    for (let i = 0; i < COUNT; i++) {
        const idx = i * 3;
        
        // Current positions (we will lerp these towards targets * expansion)
        let tx = targetPositions[idx] * expansion;
        let ty = targetPositions[idx + 1] * expansion;
        let tz = targetPositions[idx + 2] * expansion;

        // Add some "life" noise
        if (template === ParticleTemplate.FIREWORKS) {
             // Fireworks expand continuously based on tension being low? 
             // Let's make fireworks explode out when tension is low, and retract when high
             const explode = (1 - tension) * 4;
             tx = targetPositions[idx] * (1 + explode * 5); // Target positions were small sphere
             ty = targetPositions[idx + 1] * (1 + explode * 5);
             tz = targetPositions[idx + 2] * (1 + explode * 5);
        } else {
             // General breathing
             tx += Math.sin(time + i * 0.1) * 0.05 * (1 - tension); 
             ty += Math.cos(time + i * 0.1) * 0.05 * (1 - tension);
        }

        // Lerp current to target
        currentPositions.current[idx] += (tx - currentPositions.current[idx]) * 0.08;
        currentPositions.current[idx + 1] += (ty - currentPositions.current[idx + 1]) * 0.08;
        currentPositions.current[idx + 2] += (tz - currentPositions.current[idx + 2]) * 0.08;

        const x = currentPositions.current[idx];
        const y = currentPositions.current[idx + 1];
        const z = currentPositions.current[idx + 2];

        DUMMY.position.set(x, y, z);
        
        // Scale particles based on tension too (tense = smaller particles?)
        const s = (1.5 - tension) * 0.05;
        DUMMY.scale.set(s, s, s);
        
        DUMMY.updateMatrix();
        meshRef.current.setMatrixAt(i, DUMMY.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.material.color.lerp(colorObj, 0.1);
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 8, 8]} /> {/* Low poly sphere for performance */}
      <meshStandardMaterial 
        toneMapped={false}
        emissive={color}
        emissiveIntensity={1.5}
        color={color}
        roughness={0.1}
        metalness={0.8}
      />
    </instancedMesh>
  );
};
