// Ember Sigils — every tuning number and colour in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** Fixed simulation step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER_MAX_HP = 40;
export const ENEMY_MAX_HP = 52;
export const HAND_SIZE = 5;
export const HAND_LIMIT = 10;
export const START_MANA = 3;
export const MAX_MANA = 10;

/** Card layout on the table. */
export const CARD = { width: 132, height: 188, gap: 14, hoverLift: 26 };

/** Sigil schools: each has a colour AND a shape, so a card's school is told
 *  apart by colour and shape, never by text alone. */
export const SCHOOLS = {
  flame: { color: '#ff7a3c', dark: '#a83c10', shape: 'flame', label: 'Flame' },
  ward: { color: '#4fc3f7', dark: '#1668a0', shape: 'shield', label: 'Ward' },
  vine: { color: '#7ed957', dark: '#2f7a1e', shape: 'leaf', label: 'Vine' },
  arcane: { color: '#c58cff', dark: '#6a3fb0', shape: 'diamond', label: 'Arcane' },
};

export const PALETTE = {
  table: '#1c130c',
  tableEdge: '#2e2013',
  felt: '#241a10',
  panel: '#2b1f14',
  panelLine: '#4a3520',
  text: '#f5e9d3',
  muted: '#b39a78',
  gold: '#f2c94c',
  hp: '#e5534b',
  hpBack: '#3a1a16',
  block: '#4fc3f7',
  mana: '#58b7ff',
  manaEmpty: '#2c3a48',
  enemy: '#8a5a2b',
  shadow: 'rgba(0,0,0,0.45)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ember-sigils.best';

export const ENEMY_NAME = 'The Hollow Warden';
export const PLAYER_NAME = 'Ember Aspirant';
