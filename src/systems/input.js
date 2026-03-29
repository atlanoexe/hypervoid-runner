import { clamp, lerp } from '../utils/math.js';

export function createInput(surface) {
  const pressed = new Set();
  let pointerId = null;
  let touchAxis = 0;
  let carryAxis = 0;
  let lastPointerX = 0;

  const steerKeys = new Set(['a', 'd', 'arrowleft', 'arrowright']);
  surface.style.touchAction = 'none';

  const onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (steerKeys.has(key)) e.preventDefault();
    pressed.add(key);
  };

  const onKeyUp = (e) => {
    pressed.delete(e.key.toLowerCase());
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId;
    carryAxis = touchAxis;
    lastPointerX = e.clientX;
    touchAxis = 0;
    surface.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (e.pointerId !== pointerId) return;
    const width = Math.max(window.innerWidth, 1);
    const delta = (e.clientX - lastPointerX) / width;
    lastPointerX = e.clientX;
    touchAxis = clamp(touchAxis + delta * 10, -1, 1);
  };

  const releasePointer = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    carryAxis = touchAxis;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', releasePointer);
  surface.addEventListener('pointercancel', releasePointer);

  return {
    update(dt) {
      if (pointerId === null) {
        touchAxis = lerp(touchAxis, 0, Math.min(1, dt * 7));
        carryAxis = lerp(carryAxis, 0, Math.min(1, dt * 4));
      }
    },
    axis() {
      const left = pressed.has('a') || pressed.has('arrowleft');
      const right = pressed.has('d') || pressed.has('arrowright');
      const keyAxis = Number(right) - Number(left);
      return keyAxis !== 0 ? keyAxis : touchAxis;
    },
    reset() {
      pressed.clear();
      pointerId = null;
      touchAxis = 0;
      carryAxis = 0;
      lastPointerX = 0;
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      surface.removeEventListener('pointerdown', onPointerDown);
      surface.removeEventListener('pointermove', onPointerMove);
      surface.removeEventListener('pointerup', releasePointer);
      surface.removeEventListener('pointercancel', releasePointer);
    }
  };
}
