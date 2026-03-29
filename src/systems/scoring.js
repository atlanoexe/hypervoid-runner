export function createScoring() {
  let score = 0;
  return {
    add(value = 1) {
      score += value;
    },
    reset() {
      score = 0;
    },
    value() {
      return score;
    }
  };
}
