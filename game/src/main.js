// Boot and the one loop: input is read every frame, the duel advances on
// clicks and keys, and the renderer paints what is there. The game moves
// between four screens: title, play, paused and game over.
//
// ?seed=N fixes the shuffle and the Warden's choices. ?shot=start|play|win|loss
// (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createDuel, endTurn, EVENT_ENEMY, EVENT_LOSS, EVENT_PLAY, EVENT_WIN, playCard, scoreDuel, tickDuel } from './state.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_PAUSE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, endTurnRect, handCardRect, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const duel = createDuel(seed);
const renderer = createRenderer(canvas);
const audio = createAudio();

/** Debug / playtest handle: the state the screenshots and tests read. */
window.__game = {
  get screen() { return screen; },
  get phase() { return duel.phase; },
  get turn() { return duel.turn; },
  get playerHp() { return duel.player.hp; },
  get enemyHp() { return duel.enemy.hp; },
  get mana() { return duel.mana; },
  get hand() { return duel.player.hand.slice(); },
  get score() { return scoreDuel(duel); },
  get log() { return duel.log.slice(); },
};

let screen = SCREEN_TITLE;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, duel);
  screen = scene.screen;
  // A staged scene is one frozen frame: floaters from the whole duel would
  // pile up in the corner, so the shot shows the table clean.
  duel.floaters = [];
  let painted = 0;
  function paint() {
    renderer.draw(duel, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let last = performance.now();
  let announcedWin = false;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    const fresh = createDuel(Math.floor(Math.random() * 4294967296));
    duel.player = fresh.player;
    duel.enemy = fresh.enemy;
    duel.turn = fresh.turn;
    duel.mana = fresh.mana;
    duel.manaMax = fresh.manaMax;
    duel.phase = fresh.phase;
    duel.over = fresh.over;
    duel.cardsPlayed = fresh.cardsPlayed;
    duel.floaters = fresh.floaters;
    duel.log = fresh.log;
    duel.enemyIntent = fresh.enemyIntent;
    duel.shake = 0;
    announcedWin = false;
    screen = SCREEN_PLAY;
    announce(`Turn 1. ${duel.mana} mana. Play a card.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    const score = scoreDuel(duel);
    if (duel.phase === 'won') {
      audio.win();
      if (score > best) { best = score; saveBest(best); }
      announce(`Victory. Score ${score}. Best ${best}.`);
    } else {
      audio.lose();
      announce(`Defeat. The Warden stands at ${duel.enemy.hp} HP.`);
    }
  }

  function pointIn(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.width
      && point.y >= rect.y && point.y <= rect.y + rect.height;
  }

  function handleClicks() {
    for (const point of input.takeClicks()) {
      audio.unlock();
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
        startGame();
        return;
      }
      if (screen !== SCREEN_PLAY) return;
      if (pointIn(point, endTurnRect())) {
        endTurn(duel);
        audio.turn();
        if (duel.over) endGame();
        return;
      }
      const hand = duel.player.hand;
      for (let i = 0; i < hand.length; i += 1) {
        const rect = handCardRect(i, hand.length);
        if (pointIn(point, rect)) {
          const events = playCard(duel, i);
          if (events & EVENT_PLAY) {
            const card = duel.player.discard[duel.player.discard.length - 1];
            audio.playCard();
            if (card === 'aegis' || card === 'bulwark' || card === 'mirror') audio.block();
          }
          if (duel.over) endGame();
          return;
        }
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const number = input.takeNumberKey();
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
      else if (screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Playing.'); }
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    if (actions & ACTION_END_TURN || actions & ACTION_CONFIRM) {
      endTurn(duel);
      audio.turn();
      if (duel.over) endGame();
      return;
    }
    if (number >= 0 && number < duel.player.hand.length) {
      const events = playCard(duel, number);
      if (events & EVENT_PLAY) audio.playCard();
      if (duel.over) endGame();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    tickDuel(duel, dt);
    handleActions();
    handleClicks();
    const hover = input.hover();
    let hoverIndex = -1;
    if (screen === SCREEN_PLAY) {
      duel.player.hand.forEach((_, i) => {
        const rect = handCardRect(i, duel.player.hand.length);
        if (pointIn(hover, rect)) hoverIndex = i;
      });
    }
    renderer.draw(duel, screen, best, hoverIndex);
    if (duel.over && screen === SCREEN_PLAY && !announcedWin) {
      announcedWin = true;
      endGame();
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') audio.toggleMute();
    if (event.code === 'KeyR' && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_OVER)) startGame();
  });

  announce('Ember Sigils. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
