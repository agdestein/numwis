// Runs Python (Pyodide) in a Web Worker, off the page's main thread.
//
// Why a worker: a student's program can loop forever (try eps = 0 in the
// bisection code). In a worker that only blocks the worker, and the page
// can stop it by terminating the worker and starting a fresh one.
//
// Messages to the worker:   { type: "run", code, filename }
// Messages from the worker: ready | status | started | out | err | image | done | crash | fatal

// A module worker: the import below is a normal CORS request, which works in
// more browsers than importScripts() from another origin.
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

// Python side: run one program in a fresh namespace, print a short traceback
// on errors (without Pyodide's own frames) and send matplotlib figures to
// the page as PNG images, in order with the printed text.
const RUNNER = String.raw`
import base64, io, linecache, sys, traceback, warnings
import js

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
