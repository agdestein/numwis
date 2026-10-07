// Runs Python (Pyodide) in a Web Worker, off the page's main thread.
//
// Why a worker: a student's program can loop forever (try eps = 0 in the
// bisection code). In a worker that only blocks the worker, and the page
// can stop it by terminating the worker and starting a fresh one.
//
// Messages to the worker:   { type: "run", code, filename }
// Messages from the worker: ready | status | started | out | err | hint | image | done | crash | fatal

// A module worker: the import below is a normal CORS request, which works in
// more browsers than importScripts() from another origin.
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

// Python side: run one program in a fresh namespace, print a short traceback
// on errors (without Pyodide's own frames), add a Dutch hint where Python's
// message misleads beginners, and send matplotlib figures to the page as PNG
// images, in order with the printed text.
const RUNNER = String.raw`
import base64, io, json, linecache, re, sys, traceback, warnings
import js

def _name_hint(src, name, used_at):
    # A NameError points at where a name is used, e.g. at {p:.2f} in an
    # f-string, which reads as if the formatting is broken. Usually the real
    # cause is elsewhere: the line that gives the name a value never ran.
    # Returns the hint as parts: ("text", ...), ("code", ...) or ("line", ...).
    lines = src.splitlines()
    n = re.escape(name)
    assign = re.compile(rf"^(\s*)(?:for\s+{n}\s+in\b|def\s+{n}\b|{n}\s*[-+*/]?=(?!=))")
    found = [(i + 1, len(m.group(1))) for i, line in enumerate(lines) if (m := assign.match(line))]
    if not found:
        return [("text", "Tip: Python kent "), ("code", name),
                ("text", " niet, want nergens in de code krijgt het een waarde. Is het een tikfout? "
                         "Let op hoofdletters: P en p zijn verschillende namen.")]
    top = [no for no, indent in found if indent == 0]
    if top:
        if min(top) > used_at:
            return [("text", "Tip: "), ("code", name),
                    ("text", f" krijgt pas op regel {min(top)} een waarde, "
                             f"maar wordt al op regel {used_at} gebruikt.")]
        return None
    first, indent = found[0]
    where = " en ".join(str(no) for no, _ in found[:3])
    parts = [("text", "Tip: "), ("code", name),
             ("text", f" krijgt alleen een waarde binnen een lus of een if (regel {where}), "
                      "en die regel is nooit uitgevoerd.")]
    for j in range(first - 2, -1, -1):  # the line that opens that block
        text = lines[j].strip()
        if text and not text.startswith("#") and len(lines[j]) - len(lines[j].lstrip()) < indent:
            if text.startswith(("while", "if", "elif")):
                parts += [("text", f" Kijk naar regel {j + 1}:"), ("line", text),
                          ("text", "Was die voorwaarde meteen al onwaar?")]
            elif text.startswith("for"):
                parts += [("text", f" Kijk naar regel {j + 1}:"), ("line", text),
                          ("text", "Is de lus wel uitgevoerd?")]
            break
    return parts

def _hint(e, src, tb):
    if isinstance(e, NameError) and getattr(e, "name", None) and tb is not None:
        while tb.tb_next is not None:
            tb = tb.tb_next
        return _name_hint(src, e.name, tb.tb_lineno)
    return None

def _send_figures():
    plt = sys.modules.get("matplotlib.pyplot")
    if plt is None:
        return
    sys.stdout.flush()
    for num in plt.get_fignums():
        buf = io.BytesIO()
        with warnings.catch_warnings():  # matplotlib's own deprecation noise, not the student's
            warnings.simplefilter("ignore")
            plt.figure(num).savefig(buf, format="png", dpi=144, bbox_inches="tight")
        js.sendImage(base64.b64encode(buf.getvalue()).decode("ascii"))
    plt.close("all")

def _prepare_matplotlib():
    import matplotlib
    matplotlib.use("agg")
    import matplotlib.pyplot as plt
    plt.show = lambda *args, **kwargs: _send_figures()
    plt.close("all")
    plt.rcdefaults()
    plt.rcParams.update({
        "figure.figsize": (7, 4.2),
        "axes.grid": True,
        "grid.alpha": 0.3,
        "axes.spines.top": False,
        "axes.spines.right": False,
    })

def _run(src, filename):
    linecache.cache[filename] = (len(src), None, src.splitlines(True), filename)
    if "matplotlib" in src:
        try:
            _prepare_matplotlib()
        except ImportError:
            pass  # the program's own import will report it
    ok = True
    try:
        exec(compile(src, filename, "exec"), {"__name__": "__main__", "__file__": filename})
    except SystemExit:
        pass
    except BaseException as e:
        ok = False
        tb = e.__traceback__
        while tb is not None and tb.tb_frame.f_code.co_filename != filename:
            tb = tb.tb_next
        sys.stdout.flush()
        traceback.print_exception(type(e), e, tb)
        try:
            hint = _hint(e, src, tb)
        except Exception:
            hint = None
        if hint:
            sys.stderr.flush()
            js.sendHint(json.dumps(hint))
    _send_figures()
    sys.stdout.flush()
    sys.stderr.flush()
    return ok
`;

let pyodide;
let runPython; // the Python function _run defined above

function stream(type) {
  const decoder = new TextDecoder();
  return {
    write(bytes) {
      postMessage({ type, text: decoder.decode(bytes, { stream: true }) });
      return bytes.length;
    },
  };
}

self.sendImage = (png) => postMessage({ type: "image", png });
self.sendHint = (parts) => postMessage({ type: "hint", parts: JSON.parse(parts) });

const ready = (async () => {
  pyodide = await loadPyodide();
  pyodide.setStdout(stream("out"));
  pyodide.setStderr(stream("err"));
  pyodide.runPython(RUNNER);
  runPython = pyodide.globals.get("_run");
  postMessage({ type: "ready", python: pyodide.runPython("import sys; sys.version.split()[0]") });
})().catch((error) => postMessage({ type: "fatal", message: String(error) }));

self.onmessage = async ({ data }) => {
  await ready;
  if (data.type !== "run") return;
  try {
    // Fetch packages such as matplotlib the first time a program imports them.
    await pyodide.loadPackagesFromImports(data.code, {
      messageCallback: (msg) => postMessage({ type: "status", text: msg }),
      errorCallback: () => {},
    });
  } catch {
    // an unknown module is reported by Python itself when the program runs
  }
  postMessage({ type: "started" });
  const start = performance.now();
  try {
    const ok = runPython(data.code, data.filename);
    postMessage({ type: "done", ok, seconds: (performance.now() - start) / 1000 });
  } catch (error) {
    // e.g. the WebAssembly stack overflowing: this worker cannot be trusted anymore
    postMessage({ type: "crash", message: String(error) });
  }
};
