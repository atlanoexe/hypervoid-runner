export function createInput() {
  const pressed = new Set();

  const onKeyDown = (e) => pressed.add(e.key.toLowerCase());
  const onKeyUp = (e) => pressed.delete(e.key.toLowerCase());

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    axis() {
      const left = pressed.has('a') || pressed.has('arrowleft');
      const right = pressed.has('d') || pressed.has('arrowright');
      return Number(right) - Number(left);
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    }
  };
}
