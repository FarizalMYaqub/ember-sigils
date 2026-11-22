// The screenshot scenes behind ?shot=start|play|win|loss. Each one plays the
// real rules forward from a fresh duel, steered by a simple autopilot, so the
// frame is what a short game really looks like and the same seed always gives
// the same frame.
//
// The autopilot plays greedily: the most damage it can afford, then block
// when the Warden's intent is heavy, then Kindling when it is free. The win
// scene lets it play on until the Warden falls; the loss scene never plays a
// card, so the Warden's damage lands every turn; the play scene stops after
// three turns, mid-duel, hands full and both fighters bloodied.
import { CARDS } from './cards.js';
import { endTurn, playCard } from './state.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function autopilotPlay(duel) {
  let acted = true;
  let guard = 0;
  while (acted && guard < 12) {
    acted = false;
    guard += 1;
    let bestIndex = -1;
    let bestScore = -1;
    for (let i = 0; i < duel.player.hand.length; i += 1) {
      const card = CARDS[duel.player.hand[i]];
      if (card.cost > duel.mana) continue;
      let score = (card.dmg || 0) * 2 + (card.block || 0) * (duel.enemyIntent.dmg >= 7 ? 1.6 : 0.7)
        + (card.heal || 0) * 1.4 + (card.draw || 0) * 2 + (card.mana || 0) * 3
        + (card.weak || 0) * 3 - card.cost * 0.5;
      if (card.id === 'kindling' || card.id === 'tithe') score += 2;
      if (score > bestScore) { bestScore = score; bestIndex = i; }
    }
    if (bestIndex >= 0 && bestScore > 0) {
      playCard(duel, bestIndex);
      acted = true;
    }
  }
}

/**
 * Set `duel` to the named scene (start, play, win or loss; any other name is
 * start) and return the screen to draw and the best score to show.
 */
export function stageShot(name, duel) {
  if (name === 'play') {
    for (let turn = 0; turn < 2 && !duel.over; turn += 1) {
      autopilotPlay(duel);
      if (!duel.over) endTurn(duel);
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    let guard = 0;
    while (!duel.over && guard < 14) {
      guard += 1;
      autopilotPlay(duel);
      if (!duel.over) endTurn(duel);
    }
    return { screen: SCREEN_OVER, best: 0 };
  }
  if (name === 'loss') {
    let guard = 0;
    while (!duel.over && guard < 14) {
      guard += 1;
      endTurn(duel);
    }
    return { screen: SCREEN_OVER, best: 0 };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
