// Ember Sigils — everything on screen, drawn on one canvas.
// The table is a dark ember hall: the Warden sits at the top with its hand
// face-down, your hand fans across the bottom, and the middle of the table
// carries the turn banner, the log and the End Turn button. Every card is a
// rounded panel with a coloured cost gem, a sigil drawn in its school's shape,
// a name, and its effect in plain words — legible at thumbnail size.
import { CARDS } from './cards.js';
import {
  CARD, ENEMY_NAME, FIELD, PALETTE, PLAYER_NAME, SCHOOLS,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const HAND_Y = 512;
const ENEMY_HAND_Y = 96;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The on-table rectangle of the i-th card in a hand of n. A big hand fans
 *  with overlap so it always fits the table, instead of running off the edge. */
export function handCardRect(index, count) {
  const maxTotal = 1160;
  const step = count <= 1
    ? 0
    : Math.min(CARD.width + CARD.gap, (maxTotal - CARD.width) / (count - 1));
  const total = CARD.width + step * (count - 1);
  const x = (FIELD.width - total) / 2 + index * step;
  return { x, y: HAND_Y, width: CARD.width, height: CARD.height };
}

export function endTurnRect() {
  return { x: 1090, y: 330, width: 150, height: 52 };
}

/** Draw a school's sigil: flame triangle, shield, leaf circle, arcane diamond. */
function drawSigil(ctx, shape, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  if (shape === 'flame') {
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size * 0.9, cy - size * 0.1, cx + size * 0.55, cy + size * 0.55);
    ctx.quadraticCurveTo(cx, cy + size * 0.9, cx - size * 0.55, cy + size * 0.55);
    ctx.quadraticCurveTo(cx - size * 0.9, cy - size * 0.1, cx, cy - size);
  } else if (shape === 'shield') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy - size * 0.6);
    ctx.lineTo(cx + size * 0.8, cy + size * 0.1);
    ctx.quadraticCurveTo(cx + size * 0.8, cy + size * 0.85, cx, cy + size);
    ctx.quadraticCurveTo(cx - size * 0.8, cy + size * 0.85, cx - size * 0.8, cy + size * 0.1);
    ctx.lineTo(cx - size * 0.8, cy - size * 0.6);
  } else if (shape === 'leaf') {
    ctx.arc(cx, cy, size * 0.85, 0, Math.PI * 2);
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size * 0.5, cy, cx, cy + size);
    ctx.quadraticCurveTo(cx - size * 0.5, cy, cx, cy - size);
  } else {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.8, cy);
  }
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  function drawCardBack(x, y, w, h) {
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = '#3a2417';
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.stroke();
    roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 7);
    ctx.strokeStyle = '#6b4a26';
    ctx.stroke();
    drawSigil(ctx, 'flame', x + w / 2, y + h / 2, 22, '#c96a2e');
  }

  function drawCard(card, x, y, w, h, opts = {}) {
    const school = SCHOOLS[card.school];
    const lift = opts.hover ? -CARD.hoverLift : 0;
    const affordable = opts.affordable !== false;
    ctx.save();
    if (opts.hover) {
      ctx.shadowColor = PALETTE.shadow;
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
    }
    roundRect(ctx, x, y + lift, w, h, 12);
    ctx.fillStyle = affordable ? '#f7ead0' : '#c9bba4';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y + lift, w, h, 12);
    ctx.strokeStyle = school.color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = school.dark;
    ctx.fillRect(x, y + lift, w, 34);
    ctx.restore();
    // Cost gem.
    ctx.beginPath();
    ctx.arc(x + 20, y + lift + 22, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#2b6cb0';
    ctx.fill();
    ctx.strokeStyle = '#bfe3ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px ' + 'system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(card.cost), x + 20, y + lift + 23);
    // Name.
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(card.name, x + 40, y + lift + 23);
    // Sigil art.
    drawSigil(ctx, school.shape, x + w / 2, y + lift + 82, 34, school.color);
    ctx.fillStyle = school.dark;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(school.label.toUpperCase(), x + w / 2, y + lift + 128);
    // Effect text.
    ctx.fillStyle = '#2b1f14';
    ctx.font = '13px system-ui, sans-serif';
    const lines = wrapText(ctx, card.text, w - 20);
    lines.forEach((line, i) => {
      ctx.fillText(line, x + w / 2, y + lift + 148 + i * 16);
    });
    // Damage / block pips at the foot.
    let pip = '';
    if (card.dmg) pip += `⚔ ${card.dmg}  `;
    if (card.block) pip += `🛡 ${card.block}  `;
    if (card.heal) pip += `✚ ${card.heal}`;
    if (pip) {
      ctx.fillStyle = '#5a3a1a';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(pip.trim(), x + w / 2, y + lift + h - 12);
    }
  }

  function drawHpBar(x, y, w, label, hp, maxHp, block) {
    ctx.fillStyle = PALETTE.hpBack;
    roundRect(ctx, x, y, w, 20, 10);
    ctx.fill();
    const frac = Math.max(0, hp / maxHp);
    if (frac > 0) {
      ctx.fillStyle = PALETTE.hp;
      roundRect(ctx, x, y, w * frac, 20, 10);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${label}  ${hp}/${maxHp}`, x + w / 2, y + 11);
    if (block > 0) {
      ctx.fillStyle = PALETTE.block;
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Block ${block}`, x + w + 10, y + 11);
    }
  }

  function drawTable(duel) {
    // Felt + vignette + ember dots.
    ctx.fillStyle = PALETTE.table;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.felt;
    roundRect(ctx, 24, 24, FIELD.width - 48, FIELD.height - 48, 28);
    ctx.fill();
    ctx.strokeStyle = PALETTE.tableEdge;
    ctx.lineWidth = 3;
    ctx.stroke();
    const t = performance.now() / 1000;
    for (let i = 0; i < 26; i += 1) {
      const ex = (i * 173) % FIELD.width;
      const ey = (i * 97 + 40) % FIELD.height;
      const glow = 0.25 + 0.2 * Math.sin(t * 1.7 + i);
      ctx.fillStyle = `rgba(255,122,60,${Math.max(0, glow)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawFighter(duel, isEnemy) {
    const fighter = isEnemy ? duel.enemy : duel.player;
    const name = isEnemy ? ENEMY_NAME : PLAYER_NAME;
    const cx = FIELD.width / 2;
    if (isEnemy) {
      // Warden portrait: a hooded sigil.
      ctx.beginPath();
      ctx.arc(cx, 62, 34, 0, Math.PI * 2);
      ctx.fillStyle = '#4a2c14';
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.stroke();
      drawSigil(ctx, 'flame', cx, 62, 18, '#ff7a3c');
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, cx, 116);
      drawHpBar(cx - 150, 128, 300, 'HP', fighter.hp, fighter.maxHp, fighter.block);
      // Face-down hand.
      for (let i = 0; i < Math.min(fighter.hand.length, 5); i += 1) {
        drawCardBack(cx - 110 + i * 48, 158, 40, 56);
      }
      // Intent — the Warden's plan, readable so you can counter it.
      if (duel.enemyIntent && duel.phase === 'player') {
        ctx.fillStyle = '#ffd9a0';
        ctx.font = 'italic 14px system-ui, sans-serif';
        ctx.fillText(duel.enemyIntent.text, cx, 232);
      }
      if (fighter.weak > 0) {
        ctx.fillStyle = '#c58cff';
        ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(`Weakened −${fighter.weak} dmg`, cx, 252);
      }
    } else {
      drawHpBar(cx - 150, 452, 300, 'HP', fighter.hp, fighter.maxHp, fighter.block);
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(name, cx, 442);
    }
  }

  function drawMana(duel) {
    const x0 = 60;
    const y = 470;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('MANA', x0, y - 22);
    for (let i = 0; i < duel.manaMax; i += 1) {
      ctx.beginPath();
      ctx.arc(x0 + 14 + i * 30, y, 11, 0, Math.PI * 2);
      ctx.fillStyle = i < duel.mana ? PALETTE.mana : PALETTE.manaEmpty;
      ctx.fill();
      ctx.strokeStyle = '#bfe3ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`${duel.mana}/${duel.manaMax}`, x0, y + 26);
    // Piles.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`Deck ${duel.player.deck.length}`, x0, y + 52);
    ctx.fillText(`Discard ${duel.player.discard.length}`, x0, y + 72);
  }

  function drawLog(duel) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, 60, 276, 220, 130, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('LAST PLAYS', 74, 294);
    ctx.font = '13px system-ui, sans-serif';
    duel.log.forEach((line, i) => {
      ctx.fillStyle = i === 0 ? PALETTE.text : PALETTE.muted;
      ctx.fillText(line.slice(0, 34), 74, 316 + i * 20);
    });
  }

  function drawFloaters(duel) {
    duel.floaters.forEach((f, i) => {
      const up = f.age * 46;
      const alpha = Math.max(0, 1 - f.age / 1.1);
      const x = FIELD.width / 2 + 210;
      // Floaters born together (damage + block) stack instead of overlapping.
      const y = (f.side === 'player' ? 436 : 112) - up - i * 28;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.kind === 'dmg' ? '#ff6b5e' : f.kind === 'heal' ? '#7ed957' : '#4fc3f7';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(f.text, x, y);
      ctx.globalAlpha = 1;
    });
  }

  function drawBanner(text, sub) {
    ctx.fillStyle = '#241a10';
    ctx.fillRect(0, 268, FIELD.width, 64);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, FIELD.width / 2, 296);
    if (sub) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(sub, FIELD.width / 2, 320);
    }
  }

  return {
    draw(duel, screen, best, hoverIndex = -1) {
      ctx.save();
      if (duel.shake > 0) {
        ctx.translate((Math.random() - 0.5) * duel.shake, (Math.random() - 0.5) * duel.shake);
      }
      drawTable(duel);
      if (screen === SCREEN_TITLE) {
        ctx.fillStyle = PALETTE.gold;
        ctx.font = 'bold 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMBER SIGILS', FIELD.width / 2, 168);
        drawSigil(ctx, 'flame', FIELD.width / 2, 236, 40, '#ff7a3c');
        ctx.fillStyle = PALETTE.text;
        ctx.font = '20px system-ui, sans-serif';
        ctx.fillText('A duel of cards in the Ember Court. Outplay the Hollow Warden.', FIELD.width / 2, 310);
        ctx.fillStyle = PALETTE.muted;
        ctx.font = '16px system-ui, sans-serif';
        ctx.fillText('Click a card to play it · 1–7 play from hand · E ends your turn · Esc pauses', FIELD.width / 2, 348);
        ctx.fillStyle = PALETTE.gold;
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.fillText('Press Space or click to begin', FIELD.width / 2, 392);
        if (best > 0) {
          ctx.fillStyle = PALETTE.muted;
          ctx.font = '16px system-ui, sans-serif';
          ctx.fillText(`Best score: ${best}`, FIELD.width / 2, 424);
        }
        // A sample hand on the title screen, so the cover shows the cards.
        const sample = ['spark', 'aegis', 'leech', 'meteor', 'kindling'];
        sample.forEach((id, i) => {
          const rect = handCardRect(i, 5);
          drawCard(CARDS[id], rect.x, 470, rect.width, rect.height, { affordable: true });
        });
        ctx.restore();
        return;
      }
      drawFighter(duel, true);
      drawFighter(duel, false);
      drawMana(duel);
      drawLog(duel);
      // Turn banner.
      ctx.fillStyle = duel.phase === 'player' ? PALETTE.gold : PALETTE.muted;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(duel.phase === 'player' ? `TURN ${duel.turn} — YOUR MOVE` : `TURN ${duel.turn} — WARDEN PLAYS`, FIELD.width / 2, 300);
      // End Turn button.
      const btn = endTurnRect();
      const enabled = duel.phase === 'player' && !duel.over;
      roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 10);
      ctx.fillStyle = enabled ? '#b3541e' : '#4a3520';
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText('End Turn (E)', btn.x + btn.width / 2, btn.y + btn.height / 2 + 1);
      // Player hand.
      duel.player.hand.forEach((id, i) => {
        const rect = handCardRect(i, duel.player.hand.length);
        drawCard(CARDS[id], rect.x, rect.y, rect.width, rect.height, {
          hover: i === hoverIndex,
          affordable: CARDS[id].cost <= duel.mana && duel.phase === 'player',
        });
      });
      drawFloaters(duel);
      if (screen === SCREEN_PAUSED) {
        drawBanner('PAUSED', 'Esc to resume · R to restart');
      }
      if (screen === SCREEN_OVER) {
        const won = duel.phase === 'won';
        const score = won ? duel.cardsPlayed * 5 + duel.player.hp * 10 + Math.max(0, 12 - duel.turn) * 40 : 0;
        drawBanner(
          won ? 'VICTORY — THE COURT IS YOURS' : 'DEFEAT — YOUR EMBER GUTTERS OUT',
          won
            ? `Score ${score} · ${duel.turn} turns · ${duel.cardsPlayed} cards played · Best ${Math.max(best, score)}`
            : `The Warden stands at ${duel.enemy.hp} HP · Press Space to duel again`,
        );
      }
      ctx.restore();
    },
  };
}
