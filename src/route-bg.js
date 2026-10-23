import { startGL } from "./route-gl.js";
import { activateRoute } from "./route-map.js";

// Route backdrop: WebGPU via vgpu where supported, WebGL2 fallback otherwise.
// Last resort: canvas stays empty and the section keeps its flat layout.
const section = document.getElementById("route");
const canvas = document.getElementById("route-bg");

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const routeMap = section ? activateRoute(section) : null;
const getWrapRect = routeMap ? routeMap.getRect : () => ({ x0: 0, x1: 1, y0: 0.6, y1: 0.95 });
const wrapParams = () => { const r = getWrapRect(); return { x0: r.x0, x1: r.x1, y0: r.y0, y1: r.y1 }; };

async function startVGPU() {
  if (!navigator.gpu) return false;
  const { init, effect, surface, frame, frameLoop, clock } = await import("vgpu");
  const { default: routeBgShader } = await import("./route-bg.wgsl");

  const gpu = await Promise.race([
    init(),
    new Promise((_, rej) => setTimeout(() => rej(new Error("vgpu init timeout")), 3000)),
  ]);
  gpu.onError((e) => console.error("[route-bg] gpu:", e));
  const surf = surface(gpu, canvas);
  const fx = effect(gpu, routeBgShader, {
    set: { params: { time: 0, width: 1, height: 1, prog: 0, ...wrapParams() } },
  });
  surf.onResize(({ width, height }) => fx.set({ params: { width, height, ...wrapParams() } }));

  if (reduce) { frame(gpu, (f) => f.pass(surf, fx)); return true; }

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(section);

  const time = clock(gpu);
  frameLoop(gpu, (f) => {
    if (!visible) return;
    const r = section.getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    fx.set({ params: { time: time.time, prog, ...wrapParams() } });
    f.pass(surf, fx);
  });
  return true;
}

(async () => {
  if (!section || !canvas) return;
  let backend = null;
  try { if (await startVGPU()) backend = "WebGPU (vgpu)"; } catch (e) { console.warn("[route-bg] WebGPU failed, trying WebGL2:", e); }
  if (!backend) {
    try { if (startGL(canvas, section, reduce, getWrapRect)) backend = "WebGL2"; } catch (e) { console.warn("[route-bg] WebGL2 failed:", e); }
  }
  if (!backend) { canvas.remove(); routeMap?.reset(); }
  else console.debug("[route-bg] rendering via", backend);
})();
