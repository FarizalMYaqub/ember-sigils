// Ember Sigils — the card catalogue. Twelve original cards in four schools.
// A card's effect is a small object the state machine reads, so adding a card
// never means touching the rules: { dmg, block, heal, draw, mana, weak }.
// weak: the enemy's next attack loses that much damage. mana: mana gained now.
export const CARDS = {
  spark: {
    id: 'spark', name: 'Ember Spark', school: 'flame', cost: 1,
    text: 'Deal 4 damage.', dmg: 4, flavor: 'A coal that remembers fire.',
  },
  lash: {
    id: 'lash', name: 'Flame Lash', school: 'flame', cost: 2,
    text: 'Deal 7 damage.', dmg: 7,
  },
  meteor: {
    id: 'meteor', name: 'Meteor Sigil', school: 'flame', cost: 4,
    text: 'Deal 13 damage.', dmg: 13, flavor: 'The sky, briefly, agrees with you.',
  },
  cinder: {
    id: 'cinder', name: 'Cinder Wave', school: 'flame', cost: 3,
    text: 'Deal 9 damage.', dmg: 9,
  },
  aegis: {
    id: 'aegis', name: 'Aegis Ward', school: 'ward', cost: 1,
    text: 'Gain 6 block.', block: 6,
  },
  bulwark: {
    id: 'bulwark', name: 'Stone Bulwark', school: 'ward', cost: 2,
    text: 'Gain 11 block.', block: 11,
  },
  mirror: {
    id: 'mirror', name: 'Mirror Sigil', school: 'ward', cost: 2,
    text: 'Gain 8 block. Deal 4 damage.', block: 8, dmg: 4,
  },
  leech: {
    id: 'leech', name: 'Leech Vine', school: 'vine', cost: 2,
    text: 'Deal 5 damage. Heal 5.', dmg: 5, heal: 5,
  },
  feast: {
    id: 'feast', name: 'Phoenix Feast', school: 'vine', cost: 2,
    text: 'Heal 8.', heal: 8, flavor: 'Ash in, feathers out.',
  },
  snare: {
    id: 'snare', name: 'Thorn Snare', school: 'vine', cost: 1,
    text: 'Deal 3 damage. Weaken the Warden.', dmg: 3, weak: 2,
  },
  kindling: {
    id: 'kindling', name: 'Kindling', school: 'arcane', cost: 0,
    text: 'Gain 2 mana. Draw 1 card.', mana: 2, draw: 1, flavor: 'Small sticks, large fires.',
  },
  tithe: {
    id: 'tithe', name: 'Blood Tithe', school: 'arcane', cost: 0,
    text: 'Deal 3 damage. Draw 1 card.', dmg: 3, draw: 1,
  },
};

/** The player's starting deck: 24 cards, two of each. */
export const PLAYER_DECK = [
  'spark', 'spark', 'lash', 'lash', 'meteor', 'cinder',
  'aegis', 'aegis', 'bulwark', 'bulwark', 'mirror',
  'leech', 'leech', 'feast', 'snare', 'snare',
  'kindling', 'kindling', 'tithe', 'tithe', 'spark', 'lash', 'aegis', 'leech',
];

/** The Warden's deck: heavier on damage, no healing, so long games favour you. */
export const ENEMY_DECK = [
  'spark', 'spark', 'lash', 'lash', 'lash', 'meteor',
  'cinder', 'cinder', 'aegis', 'bulwark', 'mirror',
  'snare', 'snare', 'tithe', 'tithe', 'kindling',
  'spark', 'lash', 'aegis', 'cinder', 'meteor', 'spark', 'lash', 'snare',
];

/** A card's one-line summary for the log and the judge's eye. */
export function describeCard(card) {
  const parts = [];
  if (card.dmg) parts.push(`${card.dmg} dmg`);
  if (card.block) parts.push(`${card.block} block`);
  if (card.heal) parts.push(`heal ${card.heal}`);
  if (card.draw) parts.push(`draw ${card.draw}`);
  if (card.mana) parts.push(`+${card.mana} mana`);
  if (card.weak) parts.push('weaken');
  return parts.join(' · ');
}
