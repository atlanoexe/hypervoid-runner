import { GameState } from '../core/state.js';

export function difficultySystem() {
  GameState.world.difficulty = 1 + GameState.run.time * 0.05;
  GameState.world.speed = 1 + GameState.run.time * 0.02;
}
