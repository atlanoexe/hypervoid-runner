import * as THREE from 'three';
import { createEngine } from '../core/engine.js';
import { createInput } from './input.js';
import { createPlayer } from '../visuals/player.js';
import { createWormhole } from '../visuals/wormhole.js';
import { createParticleField } from '../visuals/particles.js';
import { createItemSystem } from '../visuals/items.js';
import { createScoring } from './scoring.js';
import { hitTest } from './collision.js';
import { clamp, lerp } from '../utils/math.js';
import { LANE_LIMIT, PLAYER_Y } from '../core/constants.js';

export function createGame(root, { onScore, onGameOver }) {
  const engine = createEngine(root);
  const input = createInput();
  const score = createScoring();

  const player = createPlayer();
  const wormhole = createWormhole();
  const particles = createParticleField();
  const coins = createItemSystem({ color: 0xffdc67, emissive: 0xd19a00, isCoin: true });
  const obstacles = createItemSystem({ color: 0xf24a89, emissive: 0x7d0c34, isCoin: false });

  engine.scene.add(wormhole.mesh, particles.points, coins.group, obstacles.group, player.mesh);

  const clock = new THREE.Clock();
  let running = false;
  let username = 'Pilot';
  let speed = 1;
  let targetX = 0;
  let coinSpawnZ = -24;
  let obstacleSpawnZ = -16;

  function resetPools() {
    for (const set of [coins.items, obstacles.items]) {
      for (const item of set) {
        item.active = false;
        item.mesh.visible = false;
      }
    }
  }

  function endGame() {
    running = false;
    onGameOver({ score: score.value(), username });
  }

  function updateSpawns() {
    if (coinSpawnZ > -170) coinSpawnZ = coins.spawnAhead(coinSpawnZ);
    if (obstacleSpawnZ > -170) obstacleSpawnZ = obstacles.spawnAhead(obstacleSpawnZ);
  }

  function checkCollisions() {
    for (const coin of coins.items) {
      if (!coin.active) continue;
      if (hitTest(player.mesh.position.x, PLAYER_Y, coin)) {
        coin.active = false;
        coin.mesh.visible = false;
        score.add(1);
      }
    }

    for (const obstacle of obstacles.items) {
      if (!obstacle.active) continue;
      if (hitTest(player.mesh.position.x, PLAYER_Y, obstacle)) {
        endGame();
        return;
      }
    }
  }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.033);
    const elapsed = clock.elapsedTime;

    if (running) {
      speed = Math.min(4.2, speed + dt * 0.06);

      targetX = clamp(targetX + input.axis() * dt * 14, -LANE_LIMIT, LANE_LIMIT);
      player.mesh.position.x = lerp(player.mesh.position.x, targetX, dt * 11);

      updateSpawns();
      coins.update(speed);
      obstacles.update(speed);
      checkCollisions();

      wormhole.update(speed, elapsed);
      particles.update(speed);
      player.update(elapsed);

      onScore(score.value(), speed);
    }

    engine.composer.render();
    requestAnimationFrame(tick);
  }

  tick();

  return {
    start(nextName) {
      username = nextName;
      speed = 1;
      targetX = 0;
      player.mesh.position.x = 0;
      score.reset();
      coinSpawnZ = -24;
      obstacleSpawnZ = -16;
      resetPools();
      running = true;
      onScore(0, speed);
      clock.start();
    },
    stop() {
      running = false;
      input.dispose();
      engine.dispose();
    }
  };
}
