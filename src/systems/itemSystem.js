import { ITEM_RULES } from '../core/itemConfig.js';
import { GameState } from '../core/state.js';

function updateLiveEntity(entity, dt, speed) {
  const rule = ITEM_RULES[entity.kind];
  entity.z += speed * rule.travelRate;
  entity.rotationX += dt * entity.spinX;
  entity.rotationY += dt * entity.spinY;
  entity.rotationZ += dt * entity.spinZ;
  return entity.z <= 14;
}

function updateBurstEntity(entity, dt) {
  entity.burstTime += dt;
  entity.rotationY += dt * 8.5;
  entity.rotationZ += dt * 3.8;
  return entity.burstTime < entity.burstDuration;
}

function updateCollection(entities, dt, speed) {
  return entities.filter((entity) => {
    if (entity.state === 'burst') {
      return updateBurstEntity(entity, dt);
    }

    return updateLiveEntity(entity, dt, speed);
  });
}

export function itemSystem(dt) {
  const speed = GameState.meta.baseSpeed * GameState.world.speed;

  GameState.entities.coins = updateCollection(GameState.entities.coins, dt, speed);
  GameState.entities.obstacles = updateCollection(GameState.entities.obstacles, dt, speed);
}
