import { startGL } from "./route-gl.js";

// Route backdrop: WebGPU via vgpu where supported, WebGL2 fallback otherwise.
// Pure atmosphere behind the SVG map — if neither backend starts, the canvas
// is removed and the map keeps carrying the section on its own.
const section = document.getElementById("route");
const canvas = document.getElementById("route-bg");

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    set: { params: { time: 0, width: 1, height: 1, prog: 0 } },
  });
  surf.onResize(({ width, height }) => fx.set({ params: { width, height } }));

  if (reduce) { frame(gpu, (f) => f.pass(surf, fx)); return true; }

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(section);

  const time = clock(gpu);
  frameLoop(gpu, (f) => {
    if (!visible) return;
    const r = section.getBoundingClientRect();
    const prog = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
    fx.set({ params: { time: time.time, prog } });
    f.pass(surf, fx);
  });
  return true;
}

(async () => {
  if (!section || !canvas) return;
  let backend = null;
  try { if (await startVGPU()) backend = "WebGPU (vgpu)"; } catch (e) { console.warn("[route-bg] WebGPU failed, trying WebGL2:", e); }
  if (!backend) {
    try { if (startGL(canvas, section, reduce)) backend = "WebGL2"; } catch (e) { console.warn("[route-bg] WebGL2 failed:", e); }
  }
  if (!backend) canvas.remove();
  else console.debug("[route-bg] rendering via", backend);
})();
