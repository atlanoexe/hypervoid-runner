import {
  PLAYER_FAIL_RADIUS,
  PLAYER_RADIUS,
  PLAYER_Z
} from '../core/constants.js';
import { GameState, endRun, enqueueEvent } from '../core/state.js';
import { onCoinCollected, onComboBreak, onNearMiss } from './scoring.js';

function distanceSq(item) {
  const dx = GameState.player.x - item.x;
  const dy = GameState.player.y - item.y;
  const dz = PLAYER_Z - item.z;
  return dx * dx + dy * dy + dz * dz;
}

function hitTest(item) {
  const radius = PLAYER_RADIUS + (item.radius ?? 0.8);
  return distanceSq(item) <= radius * radius;
}

function nearMissTest(item) {
  const dz = PLAYER_Z - item.z;
  if (dz < -1.8 || dz > 2.4) return false;
  const radius = PLAYER_RADIUS + (item.radius ?? 0.8) + 0.95;
  return distanceSq(item) <= radius * radius;
}

function pulsePlayer(amount) {
  GameState.player.visualPulse = Math.min(1.6, GameState.player.visualPulse + amount);
}

function failRun() {
  onComboBreak();
  pulsePlayer(1.15);
  endRun();
  enqueueEvent('feedback', { kind: 'collision' });
  enqueueEvent('gameOver');
}

export function collisionSystem() {
  if (!GameState.run.active || !GameState.player.alive) return;

  if (Math.hypot(GameState.player.x, GameState.player.y) > PLAYER_FAIL_RADIUS) {
    failRun();
    return;
  }

  for (const coin of GameState.entities.coins) {
    if (coin.state !== 'live') continue;
    if (!hitTest(coin)) continue;

    coin.state = 'burst';
    coin.burstTime = 0;
    onCoinCollected();
    pulsePlayer(0.75);
    enqueueEvent('feedback', { kind: 'coin' });
  }

  for (const obstacle of GameState.entities.obstacles) {
    if (obstacle.state !== 'live') continue;

    if (hitTest(obstacle)) {
      failRun();
      return;
    }

    if (!obstacle.nearMissed && nearMissTest(obstacle)) {
      obstacle.nearMissed = true;
      onNearMiss();
      pulsePlayer(0.25);
      enqueueEvent('feedback', { kind: 'near' });
    }
  }
}
