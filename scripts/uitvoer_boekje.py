"""Run every booklet code and save its output, before Quarto renders the site.

Each exercise page shows "Uitvoer in het boekje" next to the student's own
output. That text must be the real output of the code, produced by ordinary
Python exactly like the PDF does, so it is regenerated on every render:

    code/<name>.py  ->  code/output/<name>.txt

Only the top level of code/ is run; code/extra/ holds web-only codes that are
not in the booklet and therefore have no booklet output.
"""

import os
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
code_dir = root / "code"
out_dir = code_dir / "output"
out_dir.mkdir(exist_ok=True)

env = dict(os.environ, MPLBACKEND="Agg", PYTHONIOENCODING="utf-8")
failed = []
for script in sorted(code_dir.glob("*.py")):
    result = subprocess.run(
        [sys.executable, script.name],
        cwd=code_dir, env=env, capture_output=True, text=True, timeout=60,
    )
    (out_dir / f"{script.stem}.txt").write_text(result.stdout, encoding="utf-8")
    if result.returncode != 0:
        failed.append(script.name)
        sys.stderr.write(f"{script.name} failed:\n{result.stderr}\n")

if failed:
    sys.exit(f"booklet codes failed: {', '.join(failed)}")
print(f"uitvoer_boekje: ran {len(list(code_dir.glob('*.py')))} codes -> {out_dir.relative_to(root)}/")
