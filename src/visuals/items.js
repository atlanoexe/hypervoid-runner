import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ITEM_SCALE } from '../core/constants.js';

const COIN_MODEL_URL = '/models/coins/base_basic_shaded.glb';
const COIN_MODEL_SIZE = 1.45;

let coinPrototypePromise = null;
let coinReadyPromise = null;
let coinLoaded = false;
let coinProgress = 0;
const coinProgressListeners = new Set();

const coinLoadingManager = new THREE.LoadingManager();
const coinLoader = new GLTFLoader(coinLoadingManager);

function emitCoinProgress(nextProgress) {
  coinProgress = Math.max(coinProgress, Math.min(1, nextProgress));

  for (const listener of coinProgressListeners) {
    listener(coinProgress);
  }
}

function collectMaterialEntries(root, target) {
  root.traverse((node) => {
    if (!node.isMesh) return;

    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;

      target.push({
        material,
        baseEmissive: 'emissiveIntensity' in material ? material.emissiveIntensity ?? 0 : 0,
        baseOpacity: 'opacity' in material ? material.opacity ?? 1 : 1,
        baseTransparent: Boolean(material.transparent)
      });
    }
  });
}

function normalizeImportedModel(root, targetSize) {
  const box = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  root.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDimension;
  root.scale.setScalar(scale);
  return root;
}

function cloneSceneWithMaterials(root) {
  const clone = root.clone(true);
  clone.traverse((node) => {
    if (!node.isMesh) return;

    if (Array.isArray(node.material)) {
      node.material = node.material.map((material) => material?.clone?.() ?? material);
    } else if (node.material?.clone) {
      node.material = node.material.clone();
    }
  });
  return clone;
}

function loadCoinPrototype() {
  if (!coinPrototypePromise) {
    coinLoadingManager.onStart = () => emitCoinProgress(0.05);
    coinLoadingManager.onProgress = (_, loaded, total) => {
      if (!total) return;
      emitCoinProgress(loaded / total);
    };
    coinLoadingManager.onLoad = () => emitCoinProgress(1);

    coinPrototypePromise = coinLoader
      .loadAsync(COIN_MODEL_URL)
      .then((gltf) => {
        coinLoaded = true;
        emitCoinProgress(1);
        return normalizeImportedModel(gltf.scene, COIN_MODEL_SIZE);
      })
      .catch((error) => {
        console.error('Failed to load coin model:', error);
        emitCoinProgress(1);
        return null;
      });
  }

  return coinPrototypePromise;
}

export function preloadCoinModel() {
  if (!coinReadyPromise) {
    coinReadyPromise = loadCoinPrototype().then((prototype) => Boolean(prototype));
  }

  return coinReadyPromise;
}

export function onCoinModelLoadProgress(callback) {
  coinProgressListeners.add(callback);
  callback(coinProgress);
  return () => coinProgressListeners.delete(callback);
}

export function isCoinModelLoaded() {
  return coinLoaded;
}

function createFallbackCoinVisual() {
  return new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.19, 8, 18),
    new THREE.MeshStandardMaterial({
      color: 0xffdc67,
      emissive: 0xd19a00,
      emissiveIntensity: 1.3,
      metalness: 0.45,
      roughness: 0.35,
      transparent: true
    })
  );
}

export function createCoinMesh() {
  const coin = new THREE.Group();
  const fallback = createFallbackCoinVisual();
  const materialEntries = [];

  coin.add(fallback);
  collectMaterialEntries(fallback, materialEntries);

  coin.visible = false;
  coin.userData.itemScale = ITEM_SCALE;
  coin.userData.materialEntries = materialEntries;

  loadCoinPrototype().then((prototype) => {
    if (!prototype) return;

    const importedCoin = cloneSceneWithMaterials(prototype);
    const importedEntries = [];
    collectMaterialEntries(importedCoin, importedEntries);

    coin.clear();
    coin.add(importedCoin);
    coin.userData.materialEntries = importedEntries;
  });

  return coin;
}

export function createObstacleMesh() {
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.92, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf24a89,
      emissive: 0x7d0c34,
      emissiveIntensity: 0.6,
      metalness: 0.18,
      roughness: 0.35
    })
  );

  mesh.visible = false;
  mesh.userData.itemScale = ITEM_SCALE;
  mesh.userData.materialEntries = [
    {
      material: mesh.material,
      baseEmissive: mesh.material.emissiveIntensity ?? 0,
      baseOpacity: mesh.material.opacity ?? 1,
      baseTransparent: Boolean(mesh.material.transparent)
    }
  ];
  return mesh;
}

export function forEachItemMaterial(item, iteratee) {
  const materialEntries = item.userData.materialEntries ?? [];
  for (const entry of materialEntries) {
    iteratee(entry);
  }
}
