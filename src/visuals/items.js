import * as THREE from 'three';
import { MAX_POOL_ITEMS } from '../core/constants.js';
import { randInRange } from '../utils/math.js';

function spawnX() {
  return randInRange(-7, 7);
}

export function createItemSystem({ color, emissive, isCoin }) {
  const group = new THREE.Group();
  const items = [];

  const geometry = isCoin
    ? new THREE.TorusGeometry(0.55, 0.19, 8, 18)
    : new THREE.DodecahedronGeometry(0.9, 0);

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: isCoin ? 1.25 : 0.55,
    metalness: isCoin ? 0.45 : 0.2,
    roughness: 0.35
  });

  for (let i = 0; i < MAX_POOL_ITEMS; i++) {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.visible = false;
    group.add(mesh);
    items.push({ mesh, active: false, z: -100 });
  }

  function spawnBatch(baseZ) {
    const count = isCoin ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const slot = items.find((it) => !it.active);
      if (!slot) return;
      slot.active = true;
      slot.z = baseZ - i * randInRange(4, 12);
      slot.mesh.visible = true;
      slot.mesh.position.set(spawnX(), randInRange(-2.5, 2.5), slot.z);
      slot.mesh.scale.setScalar(1);
    }
  }

  return {
    group,
    items,
    spawnAhead(lastSpawnZ) {
      spawnBatch(lastSpawnZ - randInRange(22, 34));
      return lastSpawnZ - randInRange(22, 34);
    },
    update(speed) {
      for (const item of items) {
        if (!item.active) continue;
        item.z += speed * 0.3;
        item.mesh.position.z = item.z;
        item.mesh.rotation.x += 0.04;
        item.mesh.rotation.y += 0.05;
        if (item.z > 14) {
          item.active = false;
          item.mesh.visible = false;
        }
      }
    }
  };
}
