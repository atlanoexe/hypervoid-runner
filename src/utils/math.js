export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const lerp = (from, to, t) => from + (to - from) * t;
export const randInRange = (min, max) => min + Math.random() * (max - min);
