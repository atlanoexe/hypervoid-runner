import { PLAYER_Y, SPAWN_LOOKAHEAD, VERTICAL_LIMIT } from '../core/constants.js';
import { ITEM_RULES } from '../core/itemConfig.js';
import { GameState, nextEntityId } from '../core/state.js';
import { lerp, randInRange } from '../utils/math.js';

function spawnX() {
  return randInRange(-6.5, 6.5);
}

function spawnY() {
  return randInRange(PLAYER_Y - VERTICAL_LIMIT, PLAYER_Y + VERTICAL_LIMIT);
}

function densityLevel() {
  return Math.min(1, Math.max(0, GameState.world.difficulty - 1));
}

function advanceFrontier(frontier, travelRate, speed) {
  return frontier + speed * travelRate;
}

function createEntity(kind, z) {
  const rule = ITEM_RULES[kind];
  const scaleFactor = randInRange(rule.scale.min, rule.scale.max);

  return {
    id: nextEntityId(),
    kind,
    x: spawnX(),
    y: spawnY(),
    z,
    radius: rule.radius * scaleFactor,
    scale: scaleFactor,
    rotationX: randInRange(0, Math.PI),
    rotationY: randInRange(0, Math.PI),
    rotationZ: randInRange(0, Math.PI),
    spinX: randInRange(kind === 'coin' ? 3.6 : 2.8, kind === 'coin' ? 4.8 : 4.1),
    spinY: randInRange(kind === 'coin' ? 4.8 : 3.2, kind === 'coin' ? 5.8 : 4.5),
    spinZ: randInRange(0.6, 1.8),
    state: 'live',
    burstTime: 0,
    burstDuration: rule.burstDuration,
    nearMissed: false
  };
}

function spawnBatch(kind, baseZ, density) {
  const rule = ITEM_RULES[kind];
  const count =
    rule.batch.minCount +
    Math.floor(Math.random() * (rule.batch.variance + Math.round(density * rule.batch.densityBonus)));

  const collection = kind === 'coin' ? GameState.entities.coins : GameState.entities.obstacles;

  for (let index = 0; index < count; index += 1) {
    const spacing = randInRange(rule.spacing.min, rule.spacing.max);
    const entity = createEntity(kind, baseZ - index * spacing);
    collection.push(entity);
  }
}

function refill(kind, frontierKey) {
  const rule = ITEM_RULES[kind];
  const density = densityLevel();

  while (GameState.entities[frontierKey] > -SPAWN_LOOKAHEAD) {
    const nextZ =
      GameState.entities[frontierKey] -
      randInRange(
        lerp(rule.gap.sparseMin, rule.gap.denseMin, density),
        lerp(rule.gap.sparseMax, rule.gap.denseMax, density)
      );

    spawnBatch(kind, nextZ, density);
    GameState.entities[frontierKey] = nextZ;
  }
}

export function spawnSystem() {
  const speed = GameState.meta.baseSpeed * GameState.world.speed;

  GameState.entities.nextCoinSpawnZ = advanceFrontier(
    GameState.entities.nextCoinSpawnZ,
    ITEM_RULES.coin.travelRate,
    speed
  );
  GameState.entities.nextObstacleSpawnZ = advanceFrontier(
    GameState.entities.nextObstacleSpawnZ,
    ITEM_RULES.obstacle.travelRate,
    speed
  );

  refill('coin', 'nextCoinSpawnZ');
  refill('obstacle', 'nextObstacleSpawnZ');
}
