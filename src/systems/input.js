import { lerp } from '../utils/math.js';

const InputSettings = {
  dragSensitivity: 1.2,
  keyboardSensitivity: 1.0,
  deadzone: 0.05,
  smoothing: 0.2
};

const USE_CENTER_CONTROL = false;

function clampUnit(value) {
  return Math.max(-1, Math.min(1, value));
}

function applyDeadzone(value) {
  return Math.abs(value) < InputSettings.deadzone ? 0 : value;
}

export function createInput(surface) {
  const pressed = new Set();
  let pointerId = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragCurrentX = 0;
  let dragCurrentY = 0;
  let dragStarted = false;
  let previousMoveX = 0;
  let previousMoveY = 0;

  const steerKeys = new Set(['a', 'd', 'w', 's', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown']);
  surface.style.touchAction = 'none';

  function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  }

  const onKeyDown = (e) => {
    const key = e.key.toLowerCase();
    if (isEditableTarget(e.target)) return;
    if (steerKeys.has(key)) e.preventDefault();
    pressed.add(key);
  };

  const onKeyUp = (e) => {
    if (isEditableTarget(e.target)) return;
    pressed.delete(e.key.toLowerCase());
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerId = e.pointerId;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragCurrentX = e.clientX;
    dragCurrentY = e.clientY;
    dragStarted = true;
    surface.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (e.pointerId !== pointerId) return;
    dragCurrentX = e.clientX;
    dragCurrentY = e.clientY;
  };

  const releasePointer = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    dragStarted = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  surface.addEventListener('pointerdown', onPointerDown);
  surface.addEventListener('pointermove', onPointerMove);
  surface.addEventListener('pointerup', releasePointer);
  surface.addEventListener('pointercancel', releasePointer);

  return {
    update() {},
    axes() {
      const left = pressed.has('a') || pressed.has('arrowleft');
      const right = pressed.has('d') || pressed.has('arrowright');
      const up = pressed.has('w') || pressed.has('arrowup');
      const down = pressed.has('s') || pressed.has('arrowdown');
      const keyAxisX = Number(right) - Number(left);
      const keyAxisY = Number(up) - Number(down);
      return {
        x: keyAxisX,
        y: keyAxisY
      };
    },
    drag() {
      const viewport = window.visualViewport;
      const width = Math.max(1, Math.round(viewport?.width ?? window.innerWidth));
      const height = Math.max(1, Math.round(viewport?.height ?? window.innerHeight));
      const snapshot = {
        active: pointerId !== null,
        started: dragStarted,
        deltaX: dragCurrentX - dragStartX,
        deltaY: dragCurrentY - dragStartY,
        width,
        height
      };
      dragStarted = false;
      return snapshot;
    },
    getMovement() {
      const keyboard = this.axes();
      const drag = this.drag();
      const usingDrag = drag.active;
      const sensitivity = usingDrag ? InputSettings.dragSensitivity : InputSettings.keyboardSensitivity;

      let moveX = keyboard.x;
      let moveY = keyboard.y;

      if (usingDrag) {
        if (USE_CENTER_CONTROL) {
          moveX = (dragCurrentX - drag.width * 0.5) / drag.width;
          moveY = (drag.height * 0.5 - dragCurrentY) / drag.height;
        } else {
          moveX = drag.deltaX / drag.width;
          moveY = -drag.deltaY / drag.height;
        }
      }

      moveX = applyDeadzone(clampUnit(moveX * sensitivity));
      moveY = applyDeadzone(clampUnit(moveY * sensitivity));

      previousMoveX = applyDeadzone(lerp(previousMoveX, moveX, InputSettings.smoothing));
      previousMoveY = applyDeadzone(lerp(previousMoveY, moveY, InputSettings.smoothing));

      return {
        moveX: previousMoveX,
        moveY: previousMoveY,
        isSteering: previousMoveX !== 0 || previousMoveY !== 0,
        dragActive: drag.active,
        dragStarted: drag.started
      };
    },
    reset() {
      pressed.clear();
      pointerId = null;
      dragStartX = 0;
      dragStartY = 0;
      dragCurrentX = 0;
      dragCurrentY = 0;
      dragStarted = false;
      previousMoveX = 0;
      previousMoveY = 0;
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
