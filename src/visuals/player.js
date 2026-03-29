import * as THREE from 'three';
import { PLAYER_Y } from '../core/constants.js';

export function createPlayer() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.52, 0.18, 84, 14),
    new THREE.MeshStandardMaterial({
      color: 0x84f5ff,
      emissive: 0x2888ff,
      emissiveIntensity: 1.2,
      metalness: 0.1,
      roughness: 0.2
    })
  );

  group.add(body);
  group.position.set(0, PLAYER_Y, 8);

  return { mesh: group, update: (t) => (body.rotation.z = t * 3) };
}
