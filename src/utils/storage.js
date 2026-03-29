const NAME_KEY = 'hypervoid.username';

export function saveUsername(name) {
  localStorage.setItem(NAME_KEY, name);
}

export function loadUsername() {
  return localStorage.getItem(NAME_KEY);
}
