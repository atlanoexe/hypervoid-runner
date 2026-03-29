const NAME_KEY = 'hypervoid.username';
const BEST_PREFIX = 'hypervoid.best.';

export function saveUsername(name) {
  localStorage.setItem(NAME_KEY, name);
}

export function loadUsername() {
  return localStorage.getItem(NAME_KEY);
}

export function saveBestScore(username, score) {
  localStorage.setItem(`${BEST_PREFIX}${username}`, String(score));
}

export function loadBestScore(username) {
  return Number(localStorage.getItem(`${BEST_PREFIX}${username}`) ?? 0);
}
