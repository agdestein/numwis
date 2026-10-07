# numwis

Prototype website with interactive Python exercises for the Dutch booklet
*Numerieke Wiskunde*. Quarto website + a small custom widget that runs Python in
the browser with Pyodide. See README.md for the structure and the exercise/
parameter syntax.

## Conventions

- Site content is **Dutch**, for strong high school students; code comments and
  docs for authors are English.
- `code/*.py` are copies of the booklet codes (`MathBook/booklet/code/`) and must
  stay identical to them; web-only codes go in `code/extra/`. Student-facing code
  stays beginner-simple (plain loops and lists, Chapter 4 symbols `f`, `a`, `b`,
  `p`, `eps`, `n`).
- Exercise ids (`opgaven/<id>.qmd`, alias `/<id>`) end up in printed QR codes:
  never rename them.
- `assets/vendor/codemirror.js` is generated (`tools/codemirror`); don't edit it.
- Pyodide is pinned in `assets/python-worker.js`.

## Build

- `quarto render` (runs `scripts/uitvoer_boekje.py` first) → `_site/`
- `quarto preview` for live reload
- Deploy: push to `main` (GitHub Actions → Pages)
