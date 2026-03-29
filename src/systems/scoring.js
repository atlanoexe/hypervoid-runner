import { enqueueEvent, GameState } from '../core/state.js';

const COMBO_STEP = 0.08;
const MAX_COMBO_STEPS = 12;

function comboMultiplier() {
  return 1 + Math.min(GameState.run.combo, MAX_COMBO_STEPS) * COMBO_STEP;
}

function recalculateScore() {
  const { coins, time } = GameState.run;

  if (coins <= 0) {
    GameState.run.score = 0;
    return;
  }

  GameState.run.score = Math.round(
    Math.pow(coins, 1.2) * Math.exp(time / 25) * comboMultiplier()
  );
}

export function onCoinCollected() {
  if (!GameState.run.active) return;
  GameState.run.coins += 1;
  GameState.run.combo += 1;
  GameState.run.bestCombo = Math.max(GameState.run.bestCombo, GameState.run.combo);
  recalculateScore();
  enqueueEvent('coinCollected', { combo: GameState.run.combo });
}

export function onNearMiss() {
  if (!GameState.run.active) return;
  GameState.run.combo += 1;
  GameState.run.bestCombo = Math.max(GameState.run.bestCombo, GameState.run.combo);
  recalculateScore();
  enqueueEvent('nearMiss', { combo: GameState.run.combo });
}

export function onComboBreak() {
  GameState.run.combo = 0;
  recalculateScore();
  enqueueEvent('comboBreak');
}

export function scoringSystem(dt) {
  if (!GameState.run.active) return;
  GameState.run.time += dt;
  recalculateScore();
}
