import { PLAYER_RADIUS } from '../core/constants.js';

export function hitTest(playerX, playerY, item) {
  const dx = playerX - item.mesh.position.x;
  const dy = playerY - item.mesh.position.y;
  const dz = 8 - item.mesh.position.z;
  const distSq = dx * dx + dy * dy + dz * dz;
  const radius = PLAYER_RADIUS + 0.8;
  return distSq <= radius * radius;
}
