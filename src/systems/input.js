import { clamp, lerp } from '../utils/math.js';

export function createInput(surface) {
  const pressed = new Set();
  let pointerId = null;
  let touchAxisX = 0;
  let touchAxisY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;

  const steerKeys = new Set(['a', 'd', 'w', 's', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown']);
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
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    touchAxisX = 0;
    touchAxisY = 0;
    surface.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (e.pointerId !== pointerId) return;
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    const deltaX = (e.clientX - lastPointerX) / width;
    const deltaY = (e.clientY - lastPointerY) / height;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    touchAxisX = clamp(touchAxisX + deltaX * 10, -1, 1);
    touchAxisY = clamp(touchAxisY - deltaY * 10, -1, 1);
  };

  const releasePointer = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
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
        touchAxisX = lerp(touchAxisX, 0, Math.min(1, dt * 7));
        touchAxisY = lerp(touchAxisY, 0, Math.min(1, dt * 7));
      }
    },
    axes() {
      const left = pressed.has('a') || pressed.has('arrowleft');
      const right = pressed.has('d') || pressed.has('arrowright');
      const up = pressed.has('w') || pressed.has('arrowup');
      const down = pressed.has('s') || pressed.has('arrowdown');
      const keyAxisX = Number(right) - Number(left);
      const keyAxisY = Number(up) - Number(down);
      return {
        x: keyAxisX !== 0 ? keyAxisX : touchAxisX,
        y: keyAxisY !== 0 ? keyAxisY : touchAxisY
      };
    },
    reset() {
      pressed.clear();
      pointerId = null;
      touchAxisX = 0;
      touchAxisY = 0;
      lastPointerX = 0;
      lastPointerY = 0;
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
