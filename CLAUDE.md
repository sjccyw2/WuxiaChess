# Notes for agents working on WuxiaChess

Read `README.md` for the layout, the story's three-layer rule and the checks. Read `ROADMAP.md` before starting work.

## The roadmap

`ROADMAP.md` lists the planned work and every question waiting on the producer (the repository owner).

- Update it in the same commit as your work: tick finished items and add any you discover.
- **Questions for the producer:** ask in the session first. If the producer has not answered by the time you finish, add each unanswered question to the roadmap's *Open questions* table: the next free `Q-N` number, its area, the options with your recommendation, where it came from, and the date. Do not leave a question only in chat, a commit message, a PR body or a design document.
- Where you went ahead on your recommended default, say so in the entry, and choose only defaults that are easy to undo.
- Only the producer resolves a question. When they answer, move the entry to *Decisions* and carry the answer into the design document it affects (`wiki/content/世界觀設定.md` or `wiki/content/單輪劇本.md`).

## Before you commit

- `node tools/check-wiki.mjs` and `node tools/check-story.mjs` after changing game data or story text.
- `node tools/check-skills.mjs` after changing a skill tree.
- `python3 tools/extra-fonts.py --check` after adding Chinese text, and rebuild the font supplements if it lists characters.
