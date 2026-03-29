import { GameState } from '../core/state.js';

export function inputSystem(input) {
  const movement = input.getMovement();

  GameState.input.moveX = movement.moveX;
  GameState.input.moveY = movement.moveY;
  GameState.input.isSteering = movement.isSteering;
  GameState.input.dragActive = movement.dragActive;
  GameState.input.dragStarted = movement.dragStarted;
}
