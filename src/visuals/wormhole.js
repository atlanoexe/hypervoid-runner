import * as THREE from 'three';
import { TUNNEL_RADIUS } from '../core/constants.js';

export function createWormhole() {
  const shellGeometry = new THREE.CylinderGeometry(TUNNEL_RADIUS, TUNNEL_RADIUS, 220, 56, 1, true);
  const wireGeometry = shellGeometry.clone();
  shellGeometry.rotateX(Math.PI / 2);
  wireGeometry.rotateX(Math.PI / 2);

  const shellMaterial = new THREE.MeshStandardMaterial({
    color: 0x0d1331,
    emissive: 0x2148b4,
    emissiveIntensity: 0.65,
    side: THREE.BackSide,
    wireframe: false
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x5be0ff,
    transparent: true,
    opacity: 0.12,
    wireframe: true,
    side: THREE.BackSide
  });

  const mesh = new THREE.Group();
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  const wire = new THREE.Mesh(wireGeometry, wireMaterial);
  mesh.add(shell, wire);
  mesh.position.z = -80;

  return {
    mesh,
    update(speed, elapsed, difficulty = 0) {
      mesh.rotation.z = elapsed * 0.2;
      shellMaterial.emissiveIntensity = 0.45 + speed * 0.09;
      wireMaterial.opacity = 0.1 + difficulty * 0.12;
      mesh.scale.setScalar(1 + Math.sin(elapsed * 1.3) * 0.006);
    }
  };
}
