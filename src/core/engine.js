import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { lerp } from '../utils/math.js';

export function createEngine(container) {
  function getViewportSize() {
    const rect = container.getBoundingClientRect();
    const viewport = window.visualViewport;
    const width = Math.max(1, Math.round(rect.width || viewport?.width || window.innerWidth));
    const height = Math.max(1, Math.round(rect.height || viewport?.height || window.innerHeight));
    return { width, height };
  }

  const initialViewport = getViewportSize();
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x03050f, 30, 180);

  const camera = new THREE.PerspectiveCamera(65, initialViewport.width / initialViewport.height, 0.1, 500);
  camera.position.set(0, 0, 11);
  const baseCamera = camera.position.clone();

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(initialViewport.width, initialViewport.height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(initialViewport.width, initialViewport.height), 0.8, 0.4, 0.75);
  composer.addPass(bloom);

  const ambient = new THREE.AmbientLight(0x84b4ff, 0.7);
  const key = new THREE.PointLight(0x6b9cff, 1.25, 80, 2);
  key.position.set(0, 6, 10);
  scene.add(ambient, key);

  let driftX = 0;
  let driftY = 0;
  let roll = 0;
  let pitch = 0;
  let shake = 0;
  let pulse = 0;
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(onResize) : null;

  function onResize() {
    const viewport = getViewportSize();
    camera.aspect = viewport.width / viewport.height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(viewport.width, viewport.height, false);
    composer.setSize(viewport.width, viewport.height);
    bloom.resolution.set(viewport.width, viewport.height);
  }

  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  resizeObserver?.observe(container);

  return {
    scene,
    camera,
    renderer,
    composer,
    bump(amount = 0.3) {
      shake = Math.min(1.5, shake + amount);
      pulse = Math.min(1.1, pulse + amount * 0.55);
    },
    update(dt, elapsed, speed, playerX, playerY, steerX, steerY) {
      driftX = lerp(driftX, playerX * 0.16, Math.min(1, dt * 4));
      driftY = lerp(driftY, playerY * 0.12, Math.min(1, dt * 4));
      roll = lerp(roll, -steerX * 0.04, Math.min(1, dt * 5));
      pitch = lerp(pitch, steerY * 0.028, Math.min(1, dt * 5));
      shake = Math.max(0, shake - dt * 1.9);
      pulse = Math.max(0, pulse - dt * 2.2);

      const jitterX = Math.sin(elapsed * 48) * shake * 0.08;
      const jitterY = Math.cos(elapsed * 42) * shake * 0.05;

      camera.position.x = baseCamera.x + driftX + jitterX;
      camera.position.y = baseCamera.y + driftY + jitterY;
      camera.position.z = baseCamera.z - Math.min(0.65, (speed - 1) * 0.12) + pulse * 0.08;
      camera.rotation.x = pitch + jitterY * 0.01;
      camera.rotation.z = roll + jitterX * 0.015;
      camera.fov = 65 + Math.min(9, (speed - 1) * 2.2) + pulse * 1.8;
      camera.updateProjectionMatrix();

      bloom.strength = 0.8 + Math.min(0.55, speed * 0.08) + pulse * 0.18;
      key.intensity = 1.15 + pulse * 0.45 + speed * 0.04;
    },
    dispose() {
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      resizeObserver?.disconnect();
      renderer.dispose();
    }
  };
}
