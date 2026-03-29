import * as THREE from 'three';
import { ITEM_SCALE } from '../core/constants.js';
import { createCoinMesh, createObstacleMesh, forEachItemMaterial } from './items.js';

function acquireMesh(pool, group, factory) {
  const mesh = pool.pop() ?? factory();
  if (!mesh.parent) {
    group.add(mesh);
  }

  mesh.visible = true;
  return mesh;
}

function releaseMesh(mesh, pool) {
  mesh.visible = false;
  forEachItemMaterial(mesh, ({ material, baseOpacity, baseTransparent, baseEmissive }) => {
    if ('opacity' in material) {
      material.opacity = baseOpacity;
      material.transparent = baseTransparent;
    }

    if ('emissiveIntensity' in material) {
      material.emissiveIntensity = baseEmissive;
    }
  });

  mesh.scale.setScalar(ITEM_SCALE);
  pool.push(mesh);
}

function syncLiveMesh(mesh, entity, difficulty) {
  mesh.position.set(entity.x, entity.y, entity.z);
  mesh.rotation.set(entity.rotationX, entity.rotationY, entity.rotationZ);
  mesh.scale.setScalar(entity.scale * mesh.userData.itemScale);
  forEachItemMaterial(mesh, ({ material, baseOpacity, baseTransparent, baseEmissive }) => {
    if ('opacity' in material) {
      material.opacity = baseOpacity;
      material.transparent = baseTransparent;
    }

    if (!('emissiveIntensity' in material)) return;

    if (entity.kind === 'coin') {
      material.emissiveIntensity = baseEmissive + Math.sin(entity.z * 0.35) * 0.12 + difficulty * 0.4;
    } else {
      material.emissiveIntensity = baseEmissive + Math.min(0.25, difficulty * 0.15);
    }
  });
}

function syncBurstMesh(mesh, entity) {
  const progress = Math.min(1, entity.burstTime / entity.burstDuration);
  const baseScale = entity.scale * mesh.userData.itemScale;

  mesh.position.set(entity.x, entity.y, entity.z);
  mesh.rotation.set(entity.rotationX, entity.rotationY, entity.rotationZ);
  mesh.scale.setScalar(baseScale * (1 + progress * 1.35));
  forEachItemMaterial(mesh, ({ material, baseTransparent, baseEmissive }) => {
    if ('opacity' in material) {
      material.opacity = 1 - progress;
      material.transparent = true;
    }

    if ('emissiveIntensity' in material) {
      material.emissiveIntensity = baseEmissive * (2.2 - progress * 0.6);
    }
  });
}

function syncCollection({
  entities,
  activeMeshes,
  pool,
  group,
  factory,
  difficulty
}) {
  const nextIds = new Set();

  for (const entity of entities) {
    nextIds.add(entity.id);

    let mesh = activeMeshes.get(entity.id);
    if (!mesh) {
      mesh = acquireMesh(pool, group, factory);
      activeMeshes.set(entity.id, mesh);
    }

    if (entity.state === 'burst' && entity.burstDuration > 0) {
      syncBurstMesh(mesh, entity);
    } else {
      syncLiveMesh(mesh, entity, difficulty);
    }
  }

  for (const [id, mesh] of activeMeshes) {
    if (nextIds.has(id)) continue;
    releaseMesh(mesh, pool);
    activeMeshes.delete(id);
  }
}

export function createItemRender() {
  const group = new THREE.Group();
  const coinGroup = new THREE.Group();
  const obstacleGroup = new THREE.Group();
  group.add(coinGroup, obstacleGroup);

  const coinMeshes = new Map();
  const obstacleMeshes = new Map();
  const coinPool = [];
  const obstaclePool = [];

  return {
    group,
    reset() {
      for (const mesh of coinMeshes.values()) releaseMesh(mesh, coinPool);
      for (const mesh of obstacleMeshes.values()) releaseMesh(mesh, obstaclePool);
      coinMeshes.clear();
      obstacleMeshes.clear();
    },
    sync(entities, difficulty) {
      syncCollection({
        entities: entities.coins,
        activeMeshes: coinMeshes,
        pool: coinPool,
        group: coinGroup,
        factory: createCoinMesh,
        difficulty
      });

      syncCollection({
        entities: entities.obstacles,
        activeMeshes: obstacleMeshes,
        pool: obstaclePool,
        group: obstacleGroup,
        factory: createObstacleMesh,
        difficulty
      });
    }
  };
}
