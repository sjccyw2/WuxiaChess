// The five 境 as difficulty levels. The player picks one before each run, from those open.
// The first is open from the start; winning a run in the highest open 境 opens the next, and
// winning the fifth (which means every 境 has been won) leads to the last battle.
//
// In the story each 境 is one step in 求敗 letting go: the 戰意 on his black stones loosens and
// they grow more themselves, and so stronger (world view §8.2). In play that is, for now, the
// enemies' numbers only. The first 境 plays exactly as the game always has.
//
//   sword   the sword of the tomb this 境 is named for
//   hp      every enemy's 氣血, multiplied
//   atk     every enemy's 攻擊, multiplied
//   def     every enemy's 防禦, added
//   note    what the picker says the 境 changes
const REALMS = [
  { sword: '利劍', hp: 1, atk: 1, def: 0, note: '黑子如常。' },
  { sword: '軟劍', hp: 1.06, atk: 1.03, def: 0, note: '黑子氣血略厚，出手略重。' },
  { sword: '重劍', hp: 1.12, atk: 1.06, def: 1, note: '黑子氣血加一成，出手略重，防禦略堅。' },
  { sword: '木劍', hp: 1.22, atk: 1.11, def: 2, note: '黑子氣血加二成，出手加一成，防禦更堅。' },
  { sword: '無劍', hp: 1.3, atk: 1.15, def: 2, note: '黑子氣血加三成，出手加一成半，防禦更堅。' }
];
const REALM_COUNT = REALMS.length;
const realmIndex = (realm) => Math.min(REALM_COUNT, Math.max(1, Math.trunc(Number(realm)) || 1));
const realmRule = (realm) => REALMS[realmIndex(realm) - 1];
// A stage row [hp, atk, def, step, range] in a 境. The first 境 leaves it untouched.
function inRealm(row, realm = 1) {
  const n = realmIndex(realm);
  if (n === 1) return row;
  const { hp, atk, def } = REALMS[n - 1];
  const [h, a, d, step, range] = row;
  return [Math.round(h * hp), Math.round(a * atk), d + def, step, range];
}

export { REALMS, REALM_COUNT, realmIndex, realmRule, inRealm };
