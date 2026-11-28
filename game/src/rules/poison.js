// Poison (0.71; the producer, 2026-11-28, Q-N177 to Q-N179, and the same day: longer, decaying).
//
// Every poison is a layer: { power, through, turns, source }. It lasts POISON_SPAN times the turns
// its art or trait names, and bites at the end of each enemy turn: its full power the first time,
// then less by the same step each time, down to power ÷ turns on the last. The layers still
// running bite once, together. There is no cap on layers. The condition's `power` is what they
// bite for this round; `through` is the latest end. Nothing here imports anything, so the rules
// (game.js, battle-mastery.js, form-rules.js) can all share it.
const POISON_SPAN = 2;
const poisonSpan = (turns) => (turns || 1) * POISON_SPAN;
// A poison saved before layers is one layer; one saved before decay (no `turns`) bites flat.
const poisonLayers = (c) =>
  !c ? [] : Array.isArray(c.layers) ? c.layers : [{ power: c.power, through: c.through, source: c.source }];
// What a layer bites for in a round: power × (turns − bites already made) ÷ turns, rounded, at least 1.
function poisonBite(l, round) {
  if (!l.turns) return round <= l.through ? l.power : 0;
  const k = round - (l.through - l.turns + 1);
  if (k < 0 || k >= l.turns) return 0;
  return Math.max(1, Math.round((l.power * (l.turns - k)) / l.turns));
}
// What the layers bite for this round, together.
const poisonNow = (c, round) => poisonLayers(c).reduce((n, l) => n + poisonBite(l, round), 0);
// Every bite still to come on every layer, this round's included (引爆餘毒 adds it all).
function poisonLeft(c, round) {
  let n = 0;
  for (const l of poisonLayers(c)) for (let r = round; r <= l.through; r++) n += poisonBite(l, r);
  return n;
}
// 2 → 兩, 4 → 四, as the texts count bites.
const spanWord = (n) => (n === 2 ? '兩' : '一二三四五六七八九十'[n - 1] || String(n));

export { POISON_SPAN, poisonSpan, poisonLayers, poisonBite, poisonNow, poisonLeft, spanWord };
