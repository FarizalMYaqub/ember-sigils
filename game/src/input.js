// Ember Sigils — mouse and keyboard, read once per frame.
// Clicks are reported as a point in logical 1280x720 coordinates; the game
// decides what that point means (a card, the End Turn button, a menu item).
export const ACTION_CONFIRM = 1 << 0;
export const ACTION_PAUSE = 1 << 1;
export const ACTION_END_TURN = 1 << 2;

export function createInput(canvas) {
  const clicks = [];
  const keys = new Set();
  let actions = 0;
  let hover = { x: -1, y: -1 };
  let numberKey = -1;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
    };
  }

  canvas.addEventListener('pointermove', (event) => { hover = toLogical(event); });
  canvas.addEventListener('pointerdown', (event) => {
    // A click is a point on the table (a card, a button), not a confirm key:
    // it must never end the turn by itself. Keyboard Space/Enter confirms.
    clicks.push(toLogical(event));
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'Escape' || event.code === 'KeyP') actions |= ACTION_PAUSE;
    if (event.code === 'KeyE') actions |= ACTION_END_TURN;
    if (event.code >= 'Digit1' && event.code <= 'Digit9') {
      numberKey = Number(event.code.slice(5)) - 1;
    }
    if (event.code === 'Digit0') numberKey = 9;
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));

  return {
    /** Drain this frame's clicks (each {x, y} in logical coordinates). */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    /** Drain this frame's action flags. */
    takeActions() {
      const out = actions;
      actions = 0;
      return out;
    },
    /** Drain a pressed number key (hand index), or -1. */
    takeNumberKey() {
      const out = numberKey;
      numberKey = -1;
      return out;
    },
    /** Where the pointer is now, in logical coordinates. */
    hover() {
      return hover;
    },
    /** Whether a key is held down right now (by KeyboardEvent.code). */
    isDown(code) {
      return keys.has(code);
    },
  };
}
