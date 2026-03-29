import * as THREE from 'three';
import { createEngine } from '../core/engine.js';
import {
  beginRun,
  consumeEvents,
  GameState,
  getGameOverState,
  getHudState
} from '../core/state.js';
import { inputSystem } from './inputSystem.js';
import { createInput } from './input.js';
import { playerSystem } from './playerSystem.js';
import { spawnSystem } from './spawnSystem.js';
import { itemSystem } from './itemSystem.js';
import { collisionSystem } from './collision.js';
import { scoringSystem } from './scoring.js';
import { difficultySystem } from './difficultySystem.js';
import { createAudioSystem } from './audioSystem.js';
import { createPlayerVisual } from '../visuals/player.js';
import { createPlayerRender } from '../visuals/playerRender.js';
import { createWormhole } from '../visuals/wormhole.js';
import { createParticleField } from '../visuals/particles.js';
import { createItemRender } from '../visuals/itemsRender.js';
import { isCoinModelLoaded, onCoinModelLoadProgress, preloadCoinModel } from '../visuals/items.js';

const FEEDBACK_BUMPS = {
  coin: 0.14,
  near: 0.26,
  collision: 0.95
};

function getRenderSpeed() {
  return GameState.meta.baseSpeed * GameState.world.speed;
}

function getVisualDifficulty() {
  if (!GameState.run.active) return 0.08;
  return Math.min(1.2, Math.max(0, GameState.world.difficulty - 1));
}

export function createGame(root, { onScore, onGameOver, onFeedback = () => {} }) {
  const engine = createEngine(root);
  const input = createInput(engine.renderer.domElement);
  const audio = createAudioSystem();
  let animationFrameId = 0;
  let disposed = false;

  const playerVisual = createPlayerVisual();
  const playerRender = createPlayerRender(playerVisual);
  const wormhole = createWormhole();
  const particles = createParticleField();
  const itemRender = createItemRender();

  engine.scene.add(wormhole.mesh, particles.points, itemRender.group, playerVisual.mesh);

  const clock = new THREE.Clock();

  function ready() {
    return Promise.all([playerVisual.ready(), preloadCoinModel(), audio.ready()]).then(
      ([playerOk, coinOk, audioOk]) => playerOk && coinOk && audioOk
    );
  }

  function onLoadProgress(callback) {
    let playerProgress = 0;
    let coinProgress = isCoinModelLoaded() ? 1 : 0;
    let audioProgress = 0;

    const emitCombinedProgress = () => {
      callback((playerProgress + coinProgress + audioProgress) / 3);
    };

    const stopPlayerProgress = playerVisual.onLoadProgress((progress) => {
      playerProgress = progress;
      emitCombinedProgress();
    });

    const stopCoinProgress = onCoinModelLoadProgress((progress) => {
      coinProgress = progress;
      emitCombinedProgress();
    });

    const stopAudioProgress = audio.onLoadProgress((progress) => {
      audioProgress = progress;
      emitCombinedProgress();
    });

    emitCombinedProgress();

    return () => {
      stopPlayerProgress();
      stopCoinProgress();
      stopAudioProgress();
    };
  }

  function update(dt) {
    inputSystem(input);

    if (!GameState.run.active) {
      return;
    }

    playerSystem(dt);
    spawnSystem(dt);
    itemSystem(dt);
    collisionSystem(dt);
    scoringSystem(dt);
    difficultySystem(dt);
  }

  function processEvents() {
    for (const event of consumeEvents()) {
      if (event.type === 'feedback') {
        engine.bump(FEEDBACK_BUMPS[event.kind] ?? 0.2);
        onFeedback(event.kind);
        continue;
      }

      if (event.type === 'coinCollected') {
        audio.playCoin();
        continue;
      }

      if (event.type === 'gameOver') {
        audio.stopBackground();
        audio.playHit();
        onGameOver(getGameOverState());
      }
    }
  }

  function render(dt) {
    const speed = GameState.run.active ? getRenderSpeed() : GameState.meta.baseSpeed;
    const difficulty = getVisualDifficulty();

    playerRender.sync(GameState.player, GameState.world, speed, dt);
    itemRender.sync(GameState.entities, difficulty);
    wormhole.update(speed, GameState.world.elapsed, difficulty);
    particles.update(dt, speed, difficulty);
    engine.update(
      dt,
      GameState.world.elapsed,
      speed,
      GameState.player.x,
      GameState.player.y,
      GameState.player.motionX,
      GameState.player.motionY
    );

    onScore(getHudState());
    engine.composer.render();
  }

  function tick() {
    if (disposed) return;
    const dt = Math.min(clock.getDelta(), 0.033);
    GameState.world.elapsed += dt;
    input.update(dt);
    update(dt);
    processEvents();
    render(dt);
    animationFrameId = requestAnimationFrame(tick);
  }

  clock.start();
  tick();

  return {
    ready,
    onLoadProgress,
    isPlayerModelLoaded() {
      return playerVisual.isMirageLoaded();
    },
    start(nextName) {
      beginRun(nextName);
      input.reset();
      itemRender.reset();
      audio.unlock();
      audio.startBackground();
      onScore(getHudState());
    },
    stop() {
      disposed = true;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clock.stop();
      input.dispose();
      audio.dispose();
      engine.dispose();
    }
  };
}
