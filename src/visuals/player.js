import * as THREE from 'three';
import { PLAYER_SCALE, PLAYER_Y, PLAYER_Z } from '../core/constants.js';
import { lerp } from '../utils/math.js';

export function createPlayer() {
  const group = new THREE.Group();

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

  const glowMaterial = new THREE.MeshStandardMaterial({
    color: 0x7cf4ff,
    emissive: 0x3dfffb,
    emissiveIntensity: 1.9,
    metalness: 0,
    roughness: 0.08
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

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), glowMaterial);
  core.position.set(0, 0.02, 0.1);

  group.add(body, nose, leftWing, rightWing, stabilizer, core);
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

      core.rotation.x = elapsed * 4;
      core.rotation.y = elapsed * 3;
      hullMaterial.emissiveIntensity = 1 + speed * 0.08 + glowPulse * 0.9;
      accentMaterial.emissiveIntensity = 1.25 + glowPulse * 0.85;
      glowMaterial.emissiveIntensity = 1.8 + glowPulse * 2.5;
      core.scale.setScalar(1 + glowPulse * 0.35);
    }
  };
}
