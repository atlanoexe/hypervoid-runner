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
  SPEED_SMOOTHING,
  VERTICAL_LIMIT
} from '../core/constants.js';

export function createGame(root, { onScore, onGameOver, onFeedback = () => {} }) {
  const engine = createEngine(root);
  const input = createInput(engine.renderer.domElement);
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
  let targetY = PLAYER_Y;
  let dragAnchorX = 0;
  let dragAnchorY = PLAYER_Y;
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
    while (coinSpawnZ > -SPAWN_LOOKAHEAD) {
      coinSpawnZ = coins.spawnAhead(coinSpawnZ, difficulty);
    }
    while (obstacleSpawnZ > -SPAWN_LOOKAHEAD) {
      obstacleSpawnZ = obstacles.spawnAhead(obstacleSpawnZ, difficulty);
    }
  }

  function checkCollisions() {
    for (const coin of coins.items) {
      if (!coin.active) continue;
      if (hitTest(player.mesh.position.x, player.mesh.position.y, coin)) {
        coins.collect(coin);
        score.add(1);
        player.pulse(0.75);
        engine.bump(0.14);
        onFeedback('coin');
      }
    }

    for (const obstacle of obstacles.items) {
      if (!obstacle.active) continue;

      if (hitTest(player.mesh.position.x, player.mesh.position.y, obstacle)) {
        player.pulse(1.15);
        engine.bump(0.95);
        endGame();
        return;
      }

      if (!obstacle.nearMissed && nearMissTest(player.mesh.position.x, player.mesh.position.y, obstacle)) {
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
      const steer = input.axes();
      const drag = input.drag();

      // Speed and spawn pressure rise together, but lerp keeps the ramp readable.
      targetSpeed = Math.min(MAX_SPEED, BASE_SPEED + live.time * (0.04 + difficulty * 0.02));
      speed = lerp(speed, targetSpeed, Math.min(1, dt * SPEED_SMOOTHING));
      coinSpawnZ += speed * coins.travelRate;
      obstacleSpawnZ += speed * obstacles.travelRate;

      if (drag.active) {
        if (drag.started) {
          dragAnchorX = targetX;
          dragAnchorY = targetY;
        }

        const worldUnitsPerPixelX = (LANE_LIMIT * 2) / drag.width;
        const worldUnitsPerPixelY = (VERTICAL_LIMIT * 2) / drag.height;
        targetX = clamp(dragAnchorX + drag.deltaX * worldUnitsPerPixelX, -LANE_LIMIT, LANE_LIMIT);
        targetY = clamp(
          dragAnchorY - drag.deltaY * worldUnitsPerPixelY,
          PLAYER_Y - VERTICAL_LIMIT,
          PLAYER_Y + VERTICAL_LIMIT
        );
      } else {
        targetX = clamp(targetX + steer.x * dt * (10.5 + speed * 1.35), -LANE_LIMIT, LANE_LIMIT);
        targetY = clamp(
          targetY + steer.y * dt * (8.1 + speed * 1.1),
          PLAYER_Y - VERTICAL_LIMIT,
          PLAYER_Y + VERTICAL_LIMIT
        );
      }

      const motionX = clamp((targetX - player.mesh.position.x) / 1.1, -1, 1);
      const motionY = clamp((targetY - player.mesh.position.y) / 0.85, -1, 1);
      const horizontalFollow = drag.active ? 1 : Math.min(1, dt * (8.3 + speed));
      const verticalFollow = drag.active ? 1 : Math.min(1, dt * (7.6 + speed));
      player.mesh.position.x = lerp(player.mesh.position.x, targetX, horizontalFollow);
      player.mesh.position.y = lerp(player.mesh.position.y, targetY, verticalFollow);

      updateSpawns(difficulty);
      coins.update(dt, speed, difficulty);
      obstacles.update(dt, speed, difficulty);

      wormhole.update(speed, elapsed, difficulty);
      particles.update(dt, speed, difficulty);
      player.update(elapsed, motionX, motionY, speed, dt, targetY);
      checkCollisions();
      engine.update(dt, elapsed, speed, player.mesh.position.x, player.mesh.position.y, motionX, motionY);

      if (running) onScore({ ...score.snapshot(), username, speed });
    } else {
      input.drag();
      wormhole.update(BASE_SPEED, elapsed, 0.08);
      particles.update(dt, BASE_SPEED, 0.08);
      player.update(elapsed, 0, 0, BASE_SPEED, dt, targetY);
      engine.update(dt, elapsed, BASE_SPEED, player.mesh.position.x, player.mesh.position.y, 0, 0);
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
      targetY = PLAYER_Y;
      dragAnchorX = 0;
      dragAnchorY = PLAYER_Y;
      player.mesh.position.x = 0;
      player.mesh.position.y = PLAYER_Y;
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
