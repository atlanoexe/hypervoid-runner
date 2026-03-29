import * as THREE from 'three';
import { MAX_POOL_ITEMS, PLAYER_Y } from '../core/constants.js';
import { lerp, randInRange } from '../utils/math.js';

function spawnX() {
  return randInRange(-6.5, 6.5);
}

export function createItemSystem({ color, emissive, isCoin }) {
  const group = new THREE.Group();
  const items = [];
  const baseEmissive = isCoin ? 1.3 : 0.6;
  const radius = isCoin ? 0.6 : 0.95;

  const geometry = isCoin
    ? new THREE.TorusGeometry(0.55, 0.19, 8, 18)
    : new THREE.IcosahedronGeometry(0.92, 0);

  for (let i = 0; i < MAX_POOL_ITEMS; i++) {
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: baseEmissive,
      metalness: isCoin ? 0.45 : 0.18,
      roughness: 0.35,
      transparent: isCoin
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.visible = false;
    group.add(mesh);
    items.push({
      mesh,
      active: false,
      z: -100,
      burst: 0,
      baseScale: 1,
      baseEmissive,
      nearMissed: false,
      radius
    });
  }

  function hideItem(item) {
    item.active = false;
    item.burst = 0;
    item.nearMissed = false;
    item.mesh.visible = false;
    item.mesh.material.opacity = 1;
    item.mesh.material.emissiveIntensity = item.baseEmissive;
    item.mesh.scale.setScalar(item.baseScale || 1);
  }

  function spawnBatch(baseZ, density) {
    const count = isCoin
      ? 2 + Math.floor(Math.random() * (2 + Math.round(density * 2)))
      : 1 + Math.floor(Math.random() * (1 + Math.round(density * 2)));

    for (let i = 0; i < count; i++) {
      const slot = items.find((it) => !it.active && it.burst <= 0);
      if (!slot) return;

      const scale = isCoin ? randInRange(0.92, 1.18) : randInRange(0.88, 1.22);
      slot.active = true;
      slot.burst = 0;
      slot.nearMissed = false;
      slot.baseScale = scale;
      slot.z = baseZ - i * randInRange(isCoin ? 3.5 : 4.8, isCoin ? 8.5 : 10.8);
      slot.mesh.visible = true;
      slot.mesh.material.opacity = 1;
      slot.mesh.material.emissiveIntensity = slot.baseEmissive;
      slot.mesh.position.set(spawnX(), PLAYER_Y + randInRange(-0.35, 0.35), slot.z);
      slot.mesh.rotation.set(randInRange(0, Math.PI), randInRange(0, Math.PI), randInRange(0, Math.PI));
      slot.mesh.scale.setScalar(scale);
    }
  }

  return {
    group,
    items,
    reset() {
      for (const item of items) hideItem(item);
    },
    collect(item) {
      if (!isCoin || !item.active) return;
      item.active = false;
      item.burst = 0.18;
      item.mesh.material.emissiveIntensity = item.baseEmissive * 2.6;
    },
    spawnAhead(lastSpawnZ, density = 0) {
      const minGap = isCoin ? lerp(18, 9, density) : lerp(22, 12, density);
      const maxGap = isCoin ? lerp(30, 17, density) : lerp(32, 19, density);
      const nextZ = lastSpawnZ - randInRange(minGap, maxGap);
      spawnBatch(nextZ, density);
      return nextZ;
    },
    update(dt, speed, density = 0) {
      for (const item of items) {
        if (item.active) {
          item.z += speed * (isCoin ? 0.36 : 0.4);
          item.mesh.position.z = item.z;
          item.mesh.rotation.x += dt * (isCoin ? 4.2 : 3.4);
          item.mesh.rotation.y += dt * (isCoin ? 5.2 : 3.8);

          if (isCoin) {
            item.mesh.material.emissiveIntensity = item.baseEmissive + Math.sin(item.z * 0.35) * 0.12 + density * 0.4;
          }

          if (item.z > 14) hideItem(item);
          continue;
        }

        if (item.burst > 0) {
          item.burst = Math.max(0, item.burst - dt);
          const progress = 1 - item.burst / 0.18;
          item.mesh.visible = true;
          item.mesh.scale.setScalar(item.baseScale * (1 + progress * 1.35));
          item.mesh.material.opacity = 1 - progress;
          item.mesh.material.emissiveIntensity = item.baseEmissive * (2.2 - progress * 0.6);
          item.mesh.rotation.y += dt * 8.5;
          item.mesh.rotation.z += dt * 3.8;

          if (item.burst <= 0) {
            hideItem(item);
          }
        }
      }
    }
  };
}
