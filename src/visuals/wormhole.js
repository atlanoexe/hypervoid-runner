import * as THREE from 'three';
import { PLAYER_FAIL_RADIUS, PLAYER_SIGHT_RADIUS, PLAYER_Z, TUNNEL_RADIUS } from '../core/constants.js';

function createGuideCircle(radius, color, opacity, zOffset) {
  const geometry = new THREE.TorusGeometry(radius, 0.05, 8, 96);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.z = zOffset;
  return { ring, material };
}

function createGuideTicks(radius, color, opacity, zOffset) {
  const ticks = new THREE.Group();
  const tickGeometry = new THREE.BoxGeometry(0.12, 0.48, 0.12);
  const tickMaterial = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false
  });

  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeometry, tickMaterial);
    tick.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, zOffset);
    tick.rotation.z = angle;
    ticks.add(tick);
  }

  return { ticks, material: tickMaterial };
}

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
  mesh.position.z = -80;
  const shell = new THREE.Mesh(shellGeometry, shellMaterial);
  const wire = new THREE.Mesh(wireGeometry, wireMaterial);
  const localGuideZ = PLAYER_Z - mesh.position.z;
  const failGuide = createGuideCircle(PLAYER_FAIL_RADIUS, 0xff6a8b, 0.26, localGuideZ);
  const sightGuide = createGuideCircle(PLAYER_SIGHT_RADIUS, 0x6bdcff, 0.12, localGuideZ);
  const guideTicks = createGuideTicks(PLAYER_FAIL_RADIUS, 0xff90ad, 0.4, localGuideZ);
  mesh.add(shell, wire, sightGuide.ring, failGuide.ring, guideTicks.ticks);

  return {
    mesh,
    update(speed, elapsed, difficulty = 0) {
      mesh.rotation.z = elapsed * 0.2;
      shellMaterial.emissiveIntensity = 0.45 + speed * 0.09;
      wireMaterial.opacity = 0.1 + difficulty * 0.12;
      failGuide.material.opacity = 0.18 + difficulty * 0.16;
      sightGuide.material.opacity = 0.08 + difficulty * 0.08;
      guideTicks.material.opacity = 0.28 + difficulty * 0.18;
      mesh.scale.setScalar(1 + Math.sin(elapsed * 1.3) * 0.006);
    }
  };
}
