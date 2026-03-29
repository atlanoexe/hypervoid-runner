import * as THREE from 'three';
import { randInRange } from '../utils/math.js';

export function createParticleField(count = 450) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = randInRange(7, 10.8);
    const a = randInRange(0, Math.PI * 2);
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = Math.sin(a) * r;
    positions[i * 3 + 2] = randInRange(-180, 15);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({ color: 0x6cdbff, size: 0.06, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(geometry, material);

  return {
    points,
    update(speed) {
      const arr = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        const idx = i * 3 + 2;
        arr[idx] += speed * 0.2;
        if (arr[idx] > 16) arr[idx] = -180;
      }
      geometry.attributes.position.needsUpdate = true;
    }
  };
}
