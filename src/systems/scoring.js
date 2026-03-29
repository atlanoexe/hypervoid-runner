import { SCORE_TIME_DIVISOR } from '../core/constants.js';

export function createScoring() {
  let coins = 0;
  let startedAt = performance.now();
  let storedTime = 0;
  let running = false;

  const measureSeconds = () => (running ? (performance.now() - startedAt) * 0.001 : storedTime);
  // Keep score derived from live inputs instead of storing a mutable total.
  const weaveScore = (seconds) => Math.round(coins * Math.exp(seconds / SCORE_TIME_DIVISOR));

  return {
    start() {
      coins = 0;
      storedTime = 0;
      startedAt = performance.now();
      running = true;
    },
    stop() {
      storedTime = measureSeconds();
      running = false;
    },
    add(value = 1) {
      coins += value;
    },
    snapshot() {
      const time = measureSeconds();
      return {
        coins,
        time,
        score: coins > 0 ? weaveScore(time) : 0
      };
    }
  };
}
