import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLAYER_SCALE, PLAYER_Y, PLAYER_Z } from '../core/constants.js';

const PLAYER_MODEL_URL = '/models/mirage/Miragej.gltf';
const PLAYER_MODEL_SIZE = 3.4;
const PLAYER_MODEL_TILT_X = Math.PI - Math.PI / 4;
const PLAYER_MODEL_TURN_Y = Math.PI;
const PLAYER_MODEL_ROLL_Z = 0;
const IMPORTED_EMISSIVE_MIN = 0.02;
const IMPORTED_EMISSIVE_MAX = 0.08;

function collectEmissiveMaterials(root, target) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    const materials = Array.isArray(node.material) ? node.material : [node.material];

    for (const material of materials) {
      if (!material || !('emissiveIntensity' in material)) continue;
      const baseIntensity = material.emissiveIntensity ?? 1;
      const tunedIntensity = Math.min(
        IMPORTED_EMISSIVE_MAX,
        Math.max(IMPORTED_EMISSIVE_MIN, baseIntensity * 0.03)
      );
      material.emissiveIntensity = tunedIntensity;
      target.push({
        material,
        baseIntensity: tunedIntensity
      });
    }
  });
}

function createCenteredPivot(root) {
  const pivot = new THREE.Group();
  pivot.add(root);

  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  root.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = PLAYER_MODEL_SIZE / maxDimension;
  pivot.scale.setScalar(scale);
  return pivot;
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

export function createPlayerVisual() {
  const group = new THREE.Group();
  const shipVisual = new THREE.Group();
  const progressListeners = new Set();
  const emissiveMaterials = [];
  let resolveReady = null;
  let currentProgress = 0;
  let hasLoadedMirage = false;

  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  const manager = new THREE.LoadingManager();
  const loader = new GLTFLoader(manager);

  function emitProgress(nextProgress) {
    currentProgress = Math.max(currentProgress, Math.min(1, nextProgress));

    for (const listener of progressListeners) {
      listener(currentProgress);
    }
  }

  manager.onStart = () => emitProgress(0.05);
  manager.onProgress = (_, loaded, total) => {
    if (!total) return;
    emitProgress(loaded / total);
  };
  manager.onLoad = () => emitProgress(1);

  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cf4ff,
    emissive: 0x3dfffb,
    emissiveIntensity: 0.06,
    metalness: 0,
    roughness: 0.08,
    transparent: true,
    opacity: 0.08
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
      const modelPivot = createCenteredPivot(importedShip);
      modelPivot.rotation.set(PLAYER_MODEL_TILT_X, PLAYER_MODEL_TURN_Y, PLAYER_MODEL_ROLL_Z);
      collectEmissiveMaterials(importedShip, emissiveMaterials);
      glowCore.visible = false;
      shipVisual.add(modelPivot);
      hasLoadedMirage = true;
      emitProgress(1);
      resolveReady?.(true);
    },
    undefined,
    (error) => {
      console.error('Failed to load Mirage player model:', error);
      emitProgress(1);
      resolveReady?.(false);
    }
  );

  group.add(shipVisual, glowCore);
  group.position.set(0, PLAYER_Y, PLAYER_Z);
  group.scale.setScalar(PLAYER_SCALE);

  return {
    mesh: group,
    shipVisual,
    glowCore,
    glowMaterial,
    emissiveMaterials,
    ready() {
      return ready;
    },
    isMirageLoaded() {
      return hasLoadedMirage;
    },
    onLoadProgress(callback) {
      progressListeners.add(callback);
      callback(currentProgress);
      return () => progressListeners.delete(callback);
    }
  };
}
