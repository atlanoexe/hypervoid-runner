import * as THREE from 'three';

export function createWormhole() {
  const geometry = new THREE.CylinderGeometry(11, 11, 220, 50, 1, true);
  geometry.rotateX(Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0x0d1331,
    emissive: 0x2a3d8f,
    emissiveIntensity: 0.65,
    side: THREE.BackSide,
    wireframe: false
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.z = -80;

  return {
    mesh,
    update(speed, elapsed) {
      mesh.rotation.z = elapsed * 0.2;
      material.emissiveIntensity = 0.5 + speed * 0.012;
    }
  };
}
