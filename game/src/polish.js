// Presentation switches.
//
// Every visual upgrade added on top of the original look is guarded by one of
// these. Set a switch to false to restore the original behaviour for that one
// feature; nothing else needs to change.
//
// Two address-bar overrides exist for comparing, without editing this file:
//   game/?classic                         every switch off (the original look)
//   game/?polish-off=hitStop,screenShake  only the named switches off
const SWITCHES = {
  // Pieces on the board
  unitTokens: true, // team-coloured bases, readable health bars, sprite outline
  actedDim: true, // a hero who has acted is visibly spent
  rangeTiles: true, // restyled move and strike tiles, with the strike fringe
  tileCursor: true, // animated corner brackets on the tile under the pointer

  // Combat feel
  phaseBanner: true, // banner sweep when the side to act changes
  hitStop: true, // a few frozen frames when a blow lands
  screenShake: true, // camera kick on heavy blows
  hitFlash: true, // struck sprite flashes white
  damagePop: true, // larger damage numbers that pop and settle
  koBurst: true, // a defeated piece breaks apart instead of fading
  cameraFollow: true, // camera eases toward whoever is acting
  skillCutIn: true, // portrait cut-in for high-tier techniques
  paintedEffects: true, // hand-painted effect sheets for the famous arts (fx/painted-effects.js)
  battleMarks: true, // reinforcements' entry markers and amber strike outline, the secondary's line, the picked post's pulse
  statusLooks: true, // 定身 frost and held pose, 閉穴 talisman, 受制 green-gold side, 金剛 gold ring and 無功, 固守 ward (actors/status-looks.js)

  // World
  lighting: true, // key light, shadow and colour grade
  water: true, // water surface shading
  smoothIdle: true, // idle scene paced at the display rate, not ~9 frames a second

  // Panels
  uiChrome: true, // HUD and dialog finish, transitions, button states
  forecastBars: true, // health bars in the strike forecast
  loadingVeil: true, // title screen fades in once the scene and fonts are ready

  // Controls and layout (each one adds or moves a control, so each was approved by the owner)
  dangerZone: true, // HUD button and the D key: shade every tile the enemy can strike next turn
  nextHeroKey: true, // Tab jumps to the next hero who can still act (Shift+Tab, the previous)
  forecastSide: true, // on wide screens the strike forecast docks to the side, clear of the fighters
  forecastTrim: true, // drop the forecast's target-health row, which the health bar now shows
  tipClear: true, // phone held sideways: the tip line sits in the top row, clear of the buttons
  keyHints: true, // with a mouse at hand: the key beside 結束回合, the arts list's rows, 撤步 and the menu
  actionFlow: true // no command bar: arts open beside the hero after a move, undo sits there, End turn stands alone
};

const query = new URLSearchParams(globalThis.location?.search || '');
const off = new Set((query.get('polish-off') || '').split(',').filter(Boolean));
const classic = query.has('classic');
for (const name of Object.keys(SWITCHES)) if (classic || off.has(name)) SWITCHES[name] = false;

const POLISH = Object.freeze(SWITCHES);

// Stylesheets key off these classes, e.g. html.polish-ui-chrome .hud-box { … }
const root = globalThis.document?.documentElement;
if (root)
  for (const [name, on] of Object.entries(POLISH))
    root.classList.toggle('polish-' + name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()), on);

export { POLISH };
