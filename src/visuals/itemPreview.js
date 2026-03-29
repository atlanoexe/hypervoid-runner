import * as THREE from 'three';
import { createCoinMesh, createObstacleMesh } from './items.js';

function fitItemToPreview(itemRoot) {
  const box = new THREE.Box3().setFromObject(itemRoot);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  itemRoot.position.sub(center);

  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const targetSize = 2.5;
  const scale = targetSize / maxDimension;
  itemRoot.scale.multiplyScalar(scale);
}

function createPreviewScene(canvas, factory) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 6.6);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xdff8ff, 1.8);
  const keyLight = new THREE.DirectionalLight(0x8fd9ff, 1.6);
  keyLight.position.set(3, 4, 6);
  const fillLight = new THREE.DirectionalLight(0xffbfd9, 1.1);
  fillLight.position.set(-4, -1.5, 3);
  scene.add(ambient, keyLight, fillLight);

  const rig = new THREE.Group();
  const item = factory();
  item.visible = true;
  rig.add(item);
  fitItemToPreview(item);
  scene.add(rig);

  let lastWidth = 0;
  let lastHeight = 0;
  let lastPreviewKey = '';

  function resize() {
    const width = Math.max(1, Math.round(canvas.clientWidth));
    const height = Math.max(1, Math.round(canvas.clientHeight));
    if (width === lastWidth && height === lastHeight) return;

    lastWidth = width;
    lastHeight = height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function refreshFitIfNeeded() {
    const childKey = item.children.map((child) => child.uuid).join('|');
    const previewKey = `${childKey}:${item.userData.materialEntries?.length ?? 0}`;
    if (previewKey === lastPreviewKey) return;

    lastPreviewKey = previewKey;
    item.position.set(0, 0, 0);
    item.scale.set(1, 1, 1);
    fitItemToPreview(item);
  }

  function renderFrame(time) {
    resize();
    refreshFitIfNeeded();

    const t = time * 0.001;
    rig.rotation.x = 0.16 + Math.sin(t * 1.2) * 0.06;
    rig.rotation.y = t * 1.45;
    rig.rotation.z = Math.sin(t * 0.9) * 0.08;

    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);
}

export function mountStartScreenPreviews({ coinCanvas, obstacleCanvas }) {
  if (coinCanvas) {
    createPreviewScene(coinCanvas, createCoinMesh);
  }

  if (obstacleCanvas) {
    createPreviewScene(obstacleCanvas, createObstacleMesh);
  }
}
