[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/FarizalMYaqub/ember-sigils/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/FarizalMYaqub/ember-sigils/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

# Ember Sigils — a duel of cards in the Ember Court

You are the **Ember Aspirant**, come to claim the Ember Court from **the Hollow Warden**.
A turn-based deck-battler: play cards from your hand, spend mana, and break the
Warden's guard before it breaks yours.

## How to play

- **Click a card** (or press **1–7**) — play it, if you can afford its mana
- **E** or the **End Turn** button — end your turn; the Warden plays, then you draw 5
- **Esc / P** — pause · **R** — restart · **M** — mute · **Space** — begin / duel again

## The duel

- **40 HP for you, 52 for the Warden.** Block melts at the start of your turn, so spend it or lose it.
- **Mana grows each turn** (3, then 4, 5 … up to 10). Big sigils need patience.
- **12 original cards in 4 schools**, each told apart by colour *and* shape:
  - 🔥 **Flame** (triangle) — raw damage: Ember Spark, Flame Lash, Cinder Wave, Meteor Sigil
  - 🛡 **Ward** (shield) — block: Aegis Ward, Stone Bulwark, Mirror Sigil
  - 🌿 **Vine** (leaf) — drain and heal: Leech Vine, Phoenix Feast, Thorn Snare
  - ◆ **Arcane** (diamond) — tempo: Kindling (+2 mana, draw 1), Blood Tithe (3 dmg, draw 1)
- **The Warden shows its intent** — read what it plans next and answer with block,
  a weaken from Thorn Snare, or a race to kill it first.
- **Win** by bringing the Warden to 0 HP. Score: HP left × 10 + speed bonus + cards played × 5.
  Your best score is kept in the browser.

## Run it

No build step, no network — plain static files under `game/`:

```sh
node serve.ts
# open http://localhost:8080
```

Screenshots in `screenshots/` are real renders of the game in a browser
(`?shot=start|play|win|loss&seed=7`).

## Entry

Built for [make.fun's best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826).
`main.ts` hands the game in: it copies `game/` and `screenshots/` to
`/output` and writes `/output/dossier.json` with make.fun's vendored library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=byte&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
