import { BASE_SPEED, PLAYER_Y } from './constants.js';

function createInitialState() {
  return {
    player: {
      x: 0,
      y: PLAYER_Y,
      targetX: 0,
      targetY: PLAYER_Y,
      motionX: 0,
      motionY: 0,
      visualPulse: 0,
      alive: true
    },
    run: {
      active: false,
      username: 'Pilot',
      time: 0,
      coins: 0,
      score: 0,
      combo: 0,
      bestCombo: 0
    },
    world: {
      elapsed: 0,
      speed: 1,
      difficulty: 1
    },
    input: {
      moveX: 0,
      moveY: 0,
      isSteering: false,
      dragActive: false,
      dragStarted: false,
      dragAnchorX: 0,
      dragAnchorY: PLAYER_Y
    },
    entities: {
      nextId: 1,
      nextCoinSpawnZ: -26,
      nextObstacleSpawnZ: -18,
      coins: [],
      obstacles: []
    },
    events: [],
    meta: {
      baseSpeed: BASE_SPEED
    }
  };
}

export const GameState = createInitialState();

export function resetGameState(username = 'Pilot') {
  const next = createInitialState();
  next.run.username = username;
  Object.assign(GameState.player, next.player);
  Object.assign(GameState.run, next.run);
  Object.assign(GameState.world, next.world);
  Object.assign(GameState.input, next.input);
  GameState.entities.nextId = next.entities.nextId;
  GameState.entities.nextCoinSpawnZ = next.entities.nextCoinSpawnZ;
  GameState.entities.nextObstacleSpawnZ = next.entities.nextObstacleSpawnZ;
  GameState.entities.coins = [];
  GameState.entities.obstacles = [];
  GameState.events.length = 0;
  Object.assign(GameState.meta, next.meta);
}

export function beginRun(username = 'Pilot') {
  resetGameState(username);
  GameState.run.active = true;
}

export function endRun() {
  GameState.run.active = false;
  GameState.player.alive = false;
}

export function nextEntityId() {
  const id = GameState.entities.nextId;
  GameState.entities.nextId += 1;
  return id;
}

export function enqueueEvent(type, payload = {}) {
  GameState.events.push({ type, ...payload });
}

export function consumeEvents() {
  const events = GameState.events.slice();
  GameState.events.length = 0;
  return events;
}

export function getHudState() {
  return {
    username: GameState.run.username,
    time: GameState.run.time,
    coins: GameState.run.coins,
    score: GameState.run.score,
    combo: GameState.run.combo,
    bestCombo: GameState.run.bestCombo
  };
}

export function getGameOverState() {
  return {
    username: GameState.run.username,
    time: GameState.run.time,
    coins: GameState.run.coins,
    score: GameState.run.score,
    combo: GameState.run.combo,
    bestCombo: GameState.run.bestCombo
  };
}
