import {
  LANE_LIMIT,
  PLAYER_SIGHT_RADIUS,
  VERTICAL_LIMIT
} from '../core/constants.js';
import { GameState } from '../core/state.js';
import { clamp, lerp } from '../utils/math.js';

function clampToRadius(x, y, radius) {
  const distance = Math.hypot(x, y);
  if (distance <= radius || distance === 0) {
    return { x, y };
  }

  const scale = radius / distance;
  return {
    x: x * scale,
    y: y * scale
  };
}

export function playerSystem(dt) {
  const { input, player, world, meta } = GameState;
  const speed = meta.baseSpeed * world.speed;

  if (input.dragActive) {
    if (input.dragStarted) {
      input.dragAnchorX = player.targetX;
      input.dragAnchorY = player.targetY;
    }

    const dragTarget = clampToRadius(
      input.dragAnchorX + input.moveX * LANE_LIMIT * 2,
      input.dragAnchorY + input.moveY * VERTICAL_LIMIT * 2,
      PLAYER_SIGHT_RADIUS
    );

    player.targetX = dragTarget.x;
    player.targetY = dragTarget.y;
  } else {
    const steerTarget = clampToRadius(
      player.targetX + input.moveX * dt * (10.5 + speed * 1.35),
      player.targetY + input.moveY * dt * (8.1 + speed * 1.1),
      PLAYER_SIGHT_RADIUS
    );

    player.targetX = steerTarget.x;
    player.targetY = steerTarget.y;
  }

  player.motionX = clamp((player.targetX - player.x) / 1.1, -1, 1);
  player.motionY = clamp((player.targetY - player.y) / 0.85, -1, 1);

  const horizontalFollow = Math.min(1, dt * (8.3 + speed));
  const verticalFollow = Math.min(1, dt * (7.6 + speed));

  player.x = lerp(player.x, player.targetX, horizontalFollow);
  player.y = lerp(player.y, player.targetY, verticalFollow);
  player.visualPulse = Math.max(0, player.visualPulse - dt * 2.6);
}
