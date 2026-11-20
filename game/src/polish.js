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

  // World
  lighting: true, // key light, shadow and colour grade
  water: true, // water surface shading
  smoothIdle: true, // idle scene paced at the display rate, not ~9 frames a second

  // Panels
  uiChrome: true, // HUD and dialog finish, transitions, button states
  forecastBars: true, // health bars in the strike forecast
  loadingVeil: true // title screen fades in once the scene and fonts are ready
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
