# The prose edit of 2026-11-24

The writer's returned script package (`10-主線劇本.md`, `11-各局劇本.md`, `12-俠客劇本.md`) and their notes
(`notes.md`: a voice sheet for every speaker, the flow breaks they fixed, and ten concerns of substance
they did not write into the text). Made from the script package of 2026-11-23 (`script-package/`,
`tools/script-package.mjs`).

Brought into the game on 2026-11-24 with `node tools/script-package.mjs --apply`: 774 of 860 lines
changed, every check passing. One part was not taken: the ending's words (S181–S194,
`MAZE_TALE.finale.ending`) stay as the ending film letters them, because the run's last page shows
them straight after the film (Q-N137). The rewritten ending is in `10-主線劇本.md` here, to take
with `--apply` if the film is re-lettered. The ten concerns are Q-N138 to Q-N147 in `ROADMAP.md`.

These files are kept as the writer returned them. The ids are those of the package they were made
from, so to apply any of them again, use that package's manifest (`git show c85ca13:script-package/manifest.json`).
