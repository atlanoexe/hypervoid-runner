import * as THREE from 'three';
import { createEngine } from '../core/engine.js';
import { createInput } from './input.js';
import { createPlayer } from '../visuals/player.js';
import { createWormhole } from '../visuals/wormhole.js';
import { createParticleField } from '../visuals/particles.js';
import { createItemSystem } from '../visuals/items.js';
import { createScoring } from './scoring.js';
import { hitTest, nearMissTest } from './collision.js';
import { clamp, lerp } from '../utils/math.js';
import {
  BASE_SPEED,
  LANE_LIMIT,
  MAX_SPEED,
  PLAYER_Y,
  SPAWN_LOOKAHEAD,
  SPEED_SMOOTHING
} from '../core/constants.js';

export function createGame(root, { onScore, onGameOver, onFeedback = () => {} }) {
  const engine = createEngine(root);
  const input = createInput(root);
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
  let speed = BASE_SPEED;
  let targetSpeed = BASE_SPEED;
  let targetX = 0;
  let coinSpawnZ = -26;
  let obstacleSpawnZ = -18;

  function resetPools() {
    coins.reset();
    obstacles.reset();
  }

  function endGame() {
    if (!running) return;
    running = false;
    score.stop();
    onFeedback('collision');
    onGameOver({ ...score.snapshot(), username });
  }

  function difficultyFor(time) {
    return clamp(time / 75, 0, 1);
  }

  function updateSpawns(difficulty) {
    if (coinSpawnZ > -SPAWN_LOOKAHEAD) coinSpawnZ = coins.spawnAhead(coinSpawnZ, difficulty);
    if (obstacleSpawnZ > -SPAWN_LOOKAHEAD) obstacleSpawnZ = obstacles.spawnAhead(obstacleSpawnZ, difficulty);
  }

  function checkCollisions() {
    for (const coin of coins.items) {
      if (!coin.active) continue;
      if (hitTest(player.mesh.position.x, PLAYER_Y, coin)) {
        coins.collect(coin);
        score.add(1);
        player.pulse(0.75);
        engine.bump(0.14);
        onFeedback('coin');
      }
    }

    for (const obstacle of obstacles.items) {
      if (!obstacle.active) continue;

      if (hitTest(player.mesh.position.x, PLAYER_Y, obstacle)) {
        player.pulse(1.15);
        engine.bump(0.95);
        endGame();
        return;
      }

      if (!obstacle.nearMissed && nearMissTest(player.mesh.position.x, PLAYER_Y, obstacle)) {
        obstacle.nearMissed = true;
        player.pulse(0.25);
        engine.bump(0.26);
        onFeedback('near');
      }
    }
  }

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.033);
    const elapsed = clock.getElapsedTime();
    input.update(dt);

    if (running) {
      const live = score.snapshot();
      const difficulty = difficultyFor(live.time);
      const steer = input.axis();

      // Speed and spawn pressure rise together, but lerp keeps the ramp readable.
      targetSpeed = Math.min(MAX_SPEED, BASE_SPEED + live.time * (0.04 + difficulty * 0.02));
      speed = lerp(speed, targetSpeed, Math.min(1, dt * SPEED_SMOOTHING));

      targetX = clamp(targetX + steer * dt * (10.5 + speed * 1.35), -LANE_LIMIT, LANE_LIMIT);
      player.mesh.position.x = lerp(player.mesh.position.x, targetX, Math.min(1, dt * (8.3 + speed)));

      updateSpawns(difficulty);
      coins.update(dt, speed, difficulty);
      obstacles.update(dt, speed, difficulty);
      checkCollisions();

      wormhole.update(speed, elapsed, difficulty);
      particles.update(dt, speed, difficulty);
      player.update(elapsed, steer, speed, dt);
      engine.update(dt, elapsed, speed, player.mesh.position.x, steer);

      if (running) onScore({ ...score.snapshot(), username, speed });
    } else {
      wormhole.update(BASE_SPEED, elapsed, 0.08);
      particles.update(dt, BASE_SPEED, 0.08);
      player.update(elapsed, 0, BASE_SPEED, dt);
      engine.update(dt, elapsed, BASE_SPEED, player.mesh.position.x, 0);
    }

    engine.composer.render();
    requestAnimationFrame(tick);
  }

  tick();

  return {
    start(nextName) {
      username = nextName;
      speed = BASE_SPEED;
      targetSpeed = BASE_SPEED;
      targetX = 0;
      player.mesh.position.x = 0;
      coinSpawnZ = -26;
      obstacleSpawnZ = -18;
      resetPools();
      input.reset();
      score.start();
      running = true;
      clock.start();
      onScore({ ...score.snapshot(), username, speed });
    },
    stop() {
      running = false;
      input.dispose();
      engine.dispose();
    }
  };
}
