import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLAYER_SCALE, PLAYER_Y, PLAYER_Z } from '../core/constants.js';
import { lerp } from '../utils/math.js';

const PLAYER_MODEL_URL = '/models/mirage/Miragej.gltf';
const PLAYER_MODEL_SIZE = 3.4;

function collectEmissiveMaterials(root, target) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];

    for (const material of materials) {
      if (!material || !('emissiveIntensity' in material)) continue;
      target.push({
        material,
        baseIntensity: material.emissiveIntensity ?? 1
      });
    }
  });
}

function normalizeModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  root.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = PLAYER_MODEL_SIZE / maxDimension;
  root.scale.setScalar(scale);

  const alignedBox = new THREE.Box3().setFromObject(root);
  const alignedCenter = new THREE.Vector3();
  alignedBox.getCenter(alignedCenter);
  root.position.sub(alignedCenter);
}

function createFallbackShip() {
  const ship = new THREE.Group();

  const hullMaterial = new THREE.MeshStandardMaterial({
    color: 0xb4feff,
    emissive: 0x25c8ff,
    emissiveIntensity: 1.15,
    metalness: 0.32,
    roughness: 0.22
  });

  const accentMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4fbff,
    emissive: 0x4d9cff,
    emissiveIntensity: 1.4,
    metalness: 0.1,
    roughness: 0.18
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.45, 6, 12), hullMaterial);
  body.rotation.x = Math.PI / 2;
  body.scale.set(0.9, 0.9, 1.1);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.72, 5), accentMaterial);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -1.02;

  const wingGeometry = new THREE.BoxGeometry(1.25, 0.08, 0.44);
  const leftWing = new THREE.Mesh(wingGeometry, accentMaterial);
  leftWing.position.set(-0.58, -0.05, 0.1);
  leftWing.rotation.z = 0.16;

  const rightWing = leftWing.clone();
  rightWing.position.x *= -1;
  rightWing.rotation.z *= -1;

  const stabilizer = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.22), accentMaterial);
  stabilizer.position.set(0, 0.33, 0.58);

  ship.add(body, nose, leftWing, rightWing, stabilizer);

  return {
    ship,
    emissiveMaterials: [
      { material: hullMaterial, baseIntensity: hullMaterial.emissiveIntensity },
      { material: accentMaterial, baseIntensity: accentMaterial.emissiveIntensity }
    ]
  };
}

export function createPlayer() {
  const group = new THREE.Group();
  const shipVisual = new THREE.Group();
  const loader = new GLTFLoader();
  const emissiveMaterials = [];

  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cf4ff,
    emissive: 0x3dfffb,
    emissiveIntensity: 1.9,
    metalness: 0,
    roughness: 0.08
  });

  const glowCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), glowMaterial);
  glowCore.position.set(0, 0.02, 0.72);

  const fallback = createFallbackShip();
  shipVisual.add(fallback.ship);
  emissiveMaterials.push(...fallback.emissiveMaterials);

  loader.load(
    PLAYER_MODEL_URL,
    (gltf) => {
      emissiveMaterials.length = 0;
      shipVisual.clear();

      const importedShip = gltf.scene;
      normalizeModel(importedShip);
      collectEmissiveMaterials(importedShip, emissiveMaterials);
      shipVisual.add(importedShip);
    },
    undefined,
    (error) => {
      console.error('Failed to load Mirage player model:', error);
    }
  );

  group.add(shipVisual, glowCore);
  group.position.set(0, PLAYER_Y, PLAYER_Z);
  group.scale.setScalar(PLAYER_SCALE);

  let bank = 0;
  let pitch = 0.12;
  let yaw = 0;
  let glowPulse = 0;

  return {
    mesh: group,
    pulse(amount = 0.6) {
      glowPulse = Math.min(1.6, glowPulse + amount);
    },
    update(elapsed, steerX, steerY, speed, dt, targetY = PLAYER_Y) {
      bank = lerp(bank, -steerX * 0.58, Math.min(1, dt * 8));
      pitch = lerp(
        pitch,
        0.12 + Math.min(0.18, (speed - 1) * 0.045) + steerY * 0.22,
        Math.min(1, dt * 4)
      );
      yaw = lerp(yaw, steerX * 0.14, Math.min(1, dt * 5));
      glowPulse = Math.max(0, glowPulse - dt * 2.6);

      group.rotation.z = bank;
      group.rotation.y = yaw;
      group.rotation.x = pitch + Math.sin(elapsed * 5.2) * 0.025;
      group.position.y = targetY + Math.sin(elapsed * 3.8) * 0.08;

      shipVisual.scale.setScalar(1 + glowPulse * 0.05);
      glowCore.rotation.x = elapsed * 4;
      glowCore.rotation.y = elapsed * 3;
      glowMaterial.emissiveIntensity = 1.8 + glowPulse * 2.5;
      glowCore.scale.setScalar(1 + glowPulse * 0.35);

      for (const entry of emissiveMaterials) {
        entry.material.emissiveIntensity = entry.baseIntensity + glowPulse * 0.45;
      }
    }
  };
}
