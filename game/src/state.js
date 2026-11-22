// Ember Sigils — the duel itself. Pure turn logic, no drawing, no input:
// two fighters, a deck, a hand, mana, block that melts at the start of your
// turn, and an enemy who plays the best card it can afford, every time.
// Every number the renderer shows comes from here, and every change the
// renderer animates is announced as an event.
import { CARDS, ENEMY_DECK, PLAYER_DECK } from './cards.js';
import {
  ENEMY_MAX_HP, HAND_LIMIT, HAND_SIZE, MAX_MANA, PLAYER_MAX_HP, START_MANA,
} from './config.js';
import { createRandom, shuffle } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_PLAY = 1 << 0;
export const EVENT_ENEMY = 1 << 1;
export const EVENT_WIN = 1 << 2;
export const EVENT_LOSS = 1 << 3;
export const EVENT_TURN = 1 << 4;

/** One fighter: hit points, block, and the three piles a card game needs. */
function makeFighter(hp, deckIds, random) {
  return {
    hp, maxHp: hp, block: 0, weak: 0,
    deck: shuffle(deckIds, random),
    hand: [], discard: [], exhaust: [],
  };
}

function drawCards(fighter, count, random) {
  for (let i = 0; i < count; i += 1) {
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) return;
      fighter.deck = shuffle(fighter.discard, random);
      fighter.discard = [];
    }
    fighter.hand.push(fighter.deck.pop());
  }
  while (fighter.hand.length > HAND_LIMIT) {
    fighter.discard.push(fighter.hand.pop());
  }
}

/** Apply a card's effect. `actor` plays it, `target` receives the damage. */
function applyCard(state, actor, target, card, events) {
  if (card.mana) state.mana += card.mana;
  if (card.block) actor.block += card.block;
  if (card.dmg) {
    let dmg = card.dmg;
    if (actor.weak > 0) dmg = Math.max(0, dmg - actor.weak);
    const absorbed = Math.min(target.block, dmg);
    target.block -= absorbed;
    target.hp -= (dmg - absorbed);
    state.floaters.push({
      side: target === state.player ? 'player' : 'enemy',
      text: `-${dmg - absorbed}`, kind: 'dmg', age: 0,
    });
    if (absorbed > 0) {
      state.floaters.push({
        side: target === state.player ? 'player' : 'enemy',
        text: `Blocked ${absorbed}`, kind: 'block', age: 0,
      });
    }
  }
  if (card.heal) {
    actor.hp = Math.min(actor.maxHp, actor.hp + card.heal);
    state.floaters.push({
      side: actor === state.player ? 'player' : 'enemy',
      text: `+${card.heal}`, kind: 'heal', age: 0,
    });
  }
  if (card.weak) target.weak += card.weak;
  if (card.draw) drawCards(actor, card.draw, state.random);
  state.cardsPlayed += 1;
  state.log.unshift(`${actor === state.player ? 'You' : 'Warden'} played ${card.name} (${describeShort(card)})`);
  if (state.log.length > 5) state.log.length = 5;
  return events;
}

function describeShort(card) {
  const parts = [];
  if (card.dmg) parts.push(`${card.dmg} dmg`);
  if (card.block) parts.push(`${card.block} blk`);
  if (card.heal) parts.push(`+${card.heal} hp`);
  return parts.join(' ') || '—';
}

export function createDuel(seed) {
  const random = createRandom(seed);
  const state = {
    random,
    seed,
    player: makeFighter(PLAYER_MAX_HP, PLAYER_DECK, random),
    enemy: makeFighter(ENEMY_MAX_HP, ENEMY_DECK, random),
    turn: 1,
    mana: START_MANA,
    manaMax: START_MANA,
    phase: 'player', // 'player' | 'enemy' | 'won' | 'lost'
    over: false,
    cardsPlayed: 0,
    floaters: [],
    log: ['The Warden shuffles its deck. Your move.'],
    enemyIntent: null,
    shake: 0,
  };
  drawCards(state.player, HAND_SIZE, random);
  drawCards(state.enemy, HAND_SIZE, random);
  state.enemyIntent = planEnemy(state);
  return state;
}

/** The Warden's next move, shown face-up so you can read it and counter it. */
export function planEnemy(state) {
  const enemy = state.enemy;
  let best = null;
  let bestScore = -1;
  for (const id of enemy.hand) {
    const card = CARDS[id];
    if (!card) continue;
    const score = (card.dmg || 0) * 2 + (card.block || 0) + (card.heal || 0) * 1.5
      + (card.draw || 0) * 2 + (card.mana || 0) * 3 + (card.weak || 0) * 4 - card.cost;
    if (score > bestScore) { bestScore = score; best = card; }
  }
  if (!best) return { text: 'The Warden passes.', dmg: 0, block: 0 };
  return {
    text: `Warden plans: ${best.name}`,
    dmg: best.dmg || 0, block: best.block || 0, card: best,
  };
}

/** Play a card from the player's hand. Returns events; 0 and a log line when illegal. */
export function playCard(state, handIndex) {
  if (state.phase !== 'player' || state.over) return EVENT_NONE;
  const id = state.player.hand[handIndex];
  if (id === undefined) return EVENT_NONE;
  const card = CARDS[id];
  if (state.mana < card.cost) {
    state.log.unshift(`Not enough mana for ${card.name}.`);
    if (state.log.length > 5) state.log.length = 5;
    return EVENT_NONE;
  }
  state.mana -= card.cost;
  state.player.hand.splice(handIndex, 1);
  state.player.discard.push(id);
  let events = EVENT_PLAY;
  applyCard(state, state.player, state.enemy, card, events);
  state.shake = Math.max(state.shake, card.dmg ? 6 : 2);
  if (state.enemy.hp <= 0) {
    state.enemy.hp = 0;
    state.phase = 'won';
    state.over = true;
    state.log.unshift('The Warden falls. The Ember Court is yours.');
    return events | EVENT_WIN;
  }
  return events;
}

/** End the player's turn: the Warden plays, then a fresh turn begins. */
export function endTurn(state) {
  if (state.phase !== 'player' || state.over) return EVENT_NONE;
  let events = EVENT_TURN;
  state.phase = 'enemy';
  // The Warden spends its mana — one ahead of your curve, so it hits hard —
  // on its best cards.
  let mana = Math.min(MAX_MANA, START_MANA + state.turn);
  const enemy = state.enemy;
  let guard = 0;
  while (guard < 12) {
    guard += 1;
    let bestIndex = -1;
    let bestScore = -1;
    for (let i = 0; i < enemy.hand.length; i += 1) {
      const card = CARDS[enemy.hand[i]];
      if (card.cost > mana) continue;
      const score = (card.dmg || 0) * 2 + (card.block || 0) + (card.heal || 0) * 1.5
        + (card.draw || 0) * 2 + (card.mana || 0) * 3 + (card.weak || 0) * 4 - card.cost;
      if (score > bestScore) { bestScore = score; bestIndex = i; }
    }
    if (bestIndex < 0) break;
    const id = enemy.hand[bestIndex];
    const card = CARDS[id];
    mana -= card.cost;
    enemy.hand.splice(bestIndex, 1);
    enemy.discard.push(id);
    applyCard(state, enemy, state.player, card, events);
    events |= EVENT_ENEMY;
    state.shake = Math.max(state.shake, card.dmg ? 6 : 2);
    if (state.player.hp <= 0) {
      state.player.hp = 0;
      state.phase = 'lost';
      state.over = true;
      state.log.unshift('Your ember gutters out. The Warden keeps the court.');
      return events | EVENT_LOSS;
    }
    if (enemy.hand.length === 0) break;
  }
  // A fresh turn: block melts, mana grows, five new cards.
  state.turn += 1;
  state.player.block = 0;
  state.enemy.block = 0;
  state.player.weak = 0;
  state.enemy.weak = 0;
  state.manaMax = Math.min(MAX_MANA, START_MANA + state.turn - 1);
  state.mana = state.manaMax;
  drawCards(state.player, HAND_SIZE, state.random);
  drawCards(state.enemy, 4, state.random);
  state.enemyIntent = planEnemy(state);
  state.phase = 'player';
  state.log.unshift(`Turn ${state.turn} — ${state.mana} mana.`);
  if (state.log.length > 5) state.log.length = 5;
  return events;
}

/** Score for the win screen and the best-score board. */
export function scoreDuel(state) {
  if (!state.over) return 0;
  const hpBonus = state.player.hp * 10;
  const speedBonus = Math.max(0, 12 - state.turn) * 40;
  const playBonus = state.cardsPlayed * 5;
  return hpBonus + speedBonus + playBonus;
}

/** Advance floaters and screen shake by dt seconds. */
export function tickDuel(state, dt) {
  for (const floater of state.floaters) floater.age += dt;
  state.floaters = state.floaters.filter((f) => f.age < 1.1);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 22);
}
