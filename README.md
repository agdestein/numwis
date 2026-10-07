# numwis: online Python exercises for *Numerieke Wiskunde* (prototype)

Every exercise in the booklet gets a QR code that opens a page where students
can run the exercise's Python code, change parameters with sliders or in the
code itself, and compare their output with the output printed in the booklet.
Python runs **in the browser** ([Pyodide](https://pyodide.org), CPython compiled
to WebAssembly), so the site is plain static files on GitHub Pages: no server,
no accounts, and it does not matter if a whole class scans the same code at once.

Live: <https://agdestein.github.io/numwis/> (short exercise links such as
`agdestein.github.io/numwis/h4-bal`).

## How it fits together

```
code/*.py                 the booklet codes (copied from MathBook/booklet/code, keep identical)
code/extra/*.py           web-only codes, not in the booklet (no booklet output)
scripts/uitvoer_boekje.py pre-render: runs code/*.py -> code/output/*.txt ("Uitvoer in het boekje")
opgaven/<id>.qmd          one page per exercise; `aliases` makes the short link /<id>
index.qmd, over.qmd       start page, "Hoe werkt het?"
assets/opgave.js          the exercise widget: editor, sliders, run/stop, output, compare
assets/python-worker.js   Pyodide in a Web Worker (pinned version, loaded from jsDelivr)
assets/vendor/codemirror.js  CodeMirror 6 + Python mode, one bundled file (see tools/codemirror)
_quarto.yml               Quarto website config (sidebar, theme, includes)
.github/workflows/pages.yml  render + deploy to GitHub Pages on every push to main
```

The code runs in a Web Worker so that an infinite loop (try `eps = 0` in the
bisection code) only blocks the worker: the page stops it after 10 seconds or
2000 lines of output, or when the student presses Stop, and starts a fresh
Python. Packages such as `matplotlib` are downloaded on first import;
figures are shown inline when the code calls `plt.show()`.

## Adding an exercise

1. Put the code in `code/` (booklet code) or `code/extra/` (web-only).
   Keep it beginner-simple; it is exactly what students see.
2. Create `opgaven/<id>.qmd`. Pick a short, stable `<id>` (it is printed in
   the booklet's QR code, so never rename it):

   ````markdown
   ---
   title: "De drijvende bal"
   subtitle: "Opgave 1 · bisectie (§ 4.2)"
   aliases:
     - ../h4-bal.html
   ---

   Problem text, with $math$.

   ::: {.opgave code="bisectie_bal.py"}
   ```{.parameters}
   a   : -10 .. 30 step 0.5        # help text under the slider
   eps : 0.1 | 0.01 | 0.001 | 0    # fixed choices, written as in the code
   p0  : text                      # free text box
   ```
   :::
   ````

   A parameter is a value that is already in the code: the right-hand side of a
   top-level `name = ...` line, or the list in `for name in ...:`. Moving a
   slider rewrites that value in the editor and dims the old output until the
   student presses Run; editing the code moves the slider. The `parameters`
   block is optional.
3. Add the page to the sidebar in `_quarto.yml` and a card to `index.qmd`.

## Local preview

Install [Quarto](https://quarto.org/docs/get-started/) (Arch: `quarto-cli-bin`
from the AUR), then

```bash
quarto preview
```

or `quarto render` followed by `python3 -m http.server -d _site`. The site
must be served over HTTP (not opened as a file) for the Web Worker to load.

## Deploying

Pushing to `main` runs `.github/workflows/pages.yml`. In the repository
settings, Pages must be set to **Source: GitHub Actions**.

## Updating the editor bundle

```bash
cd tools/codemirror && npm ci && npm run build
```

## Next steps

- Self-host the Pyodide files in the Pages build instead of loading them from
  jsDelivr, so the printed QR codes keep working for as long as the booklet is used.
- Move to a booklet-owned GitHub organization and a custom domain before printing.
- Generate `code/` from the booklet sources instead of copying.
