import { PLAYER_RADIUS, PLAYER_Z } from '../core/constants.js';

function distanceSq(playerX, playerY, item) {
  const dx = playerX - item.mesh.position.x;
  const dy = playerY - item.mesh.position.y;
  const dz = PLAYER_Z - item.mesh.position.z;
  return dx * dx + dy * dy + dz * dz;
}

export function hitTest(playerX, playerY, item) {
  const radius = PLAYER_RADIUS + (item.radius ?? 0.8);
  return distanceSq(playerX, playerY, item) <= radius * radius;
}

export function nearMissTest(playerX, playerY, item) {
  const dz = PLAYER_Z - item.mesh.position.z;
  if (dz < -1.8 || dz > 2.4) return false;
  const radius = PLAYER_RADIUS + (item.radius ?? 0.8) + 0.95;
  return distanceSq(playerX, playerY, item) <= radius * radius;
}
