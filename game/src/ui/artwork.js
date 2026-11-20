// Every picture and font lives in game/assets/. Paths are relative to the page that
// loads the game, so pass a different base when the modules are used elsewhere (the wiki).
let base = 'assets/';

function setArtBase(path) {
  base = path;
}
function art(filename) {
  return base + filename;
}

export { art, setArtBase };
