import * as THREE from 'three';
import { randInRange } from '../utils/math.js';

export function createParticleField(count = 680) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = randInRange(7, 10.8);
    const a = randInRange(0, Math.PI * 2);
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r;
    positions[i * 3 + 2] = randInRange(-180, 15);
    speeds[i] = randInRange(0.8, 1.5);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0x86e9ff,
    size: 0.07,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);

  return {
    points,
    update(dt, speed, difficulty = 0) {
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 2;
        arr[idx] += speed * speeds[i] * (0.35 + difficulty * 0.1);
        if (arr[idx] > 16) arr[idx] = -180;
      }

      material.size = 0.06 + Math.min(0.09, speed * 0.012);
      material.opacity = 0.76 + Math.min(0.16, difficulty * 0.22);
      geometry.attributes.position.needsUpdate = true;
    }
  };
}
