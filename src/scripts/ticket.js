// Holographic ticket: 3D tilt toward the pointer (CSS vars on .tk) and the foil
// band rendered by a vgpu shader. Without WebGPU the CSS foil (.tk-foil) stays.
// With reduced motion the ticket sits still and the shader draws a single frame.
const scene = document.querySelector(".tk-scene");
const tk = scene?.querySelector(".tk");
const canvas = scene?.querySelector(".tk-holo");

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
// smoothed tilt (-1..1), pointer target and hover amount, shared with the shader
const s = { x: 0, y: 0, tx: 0, ty: 0, hover: 0, th: 0 };
let visible = false;

function applyVars() {
  tk.style.setProperty("--mx", s.x.toFixed(4));
  tk.style.setProperty("--my", s.y.toFixed(4));
  tk.style.setProperty("--hv", s.hover.toFixed(4));
}

function startTilt() {
  const set = (e) => {
    const r = scene.getBoundingClientRect();
    s.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    s.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    s.th = 1;
  };
  scene.addEventListener("pointermove", set);
  scene.addEventListener("pointerdown", set);
  scene.addEventListener("pointerleave", () => { s.th = 0; });

  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!visible) return;
    // idle: a slow sway so the foil keeps catching light without a pointer
    const t = now / 1000;
    const ix = Math.sin(t * 0.55) * 0.35, iy = Math.sin(t * 0.8 + 1.3) * 0.2;
    const k = s.th ? 0.14 : 0.04;
    s.hover += (s.th - s.hover) * 0.08;
    s.x += ((s.th ? s.tx : ix) - s.x) * k;
    s.y += ((s.th ? s.ty : iy) - s.y) * k;
    applyVars();
  };
  requestAnimationFrame(loop);
}

async function startHolo() {
  if (!navigator.gpu) return false;
  const { init, effect, surface, frame, frameLoop, clock } = await import("vgpu");
  const { default: holoShader } = await import("./ticket-holo.wgsl");

  const gpu = await Promise.race([
    init(),
    new Promise((_, rej) => setTimeout(() => rej(new Error("vgpu init timeout")), 3000)),
  ]);
  gpu.onError((e) => console.error("[ticket] gpu:", e));
  const surf = surface(gpu, canvas, { alphaMode: "premultiplied", clearColor: [0, 0, 0, 0] });
  const fx = effect(gpu, holoShader, {
    set: { params: { time: 0, width: 1, height: 1, hover: 0, mx: 0, my: 0, pad0: 0, pad1: 0 } },
  });
  surf.onResize(({ width, height }) => fx.set({ params: { width, height } }));

  if (reduce) { frame(gpu, (f) => f.pass(surf, fx)); return true; }

  const time = clock(gpu);
  frameLoop(gpu, (f) => {
    if (!visible) return;
    fx.set({ params: { time: time.time, mx: s.x, my: s.y, hover: s.hover } });
    f.pass(surf, fx);
  });
  return true;
}

if (scene && tk && canvas) {
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "120px" }).observe(scene);
  if (!reduce) startTilt();
  // the shader only loads once the ticket is about to scroll in
  new IntersectionObserver(async ([e], o) => {
    if (!e.isIntersecting) return;
    o.disconnect();
    let ok = false;
    try { ok = await startHolo(); } catch (err) { console.warn("[ticket] WebGPU foil unavailable, CSS foil stays:", err); }
    if (ok) tk.classList.add("gpu");
    else canvas.remove();
  }, { rootMargin: "600px" }).observe(scene);
}
