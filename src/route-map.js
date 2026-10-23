// Shared layout for the route elevation chart: positions the DOM stops exactly
// on the shader's curve and exposes the chart rect in section-uv coordinates.
// Must mirror curveV() in route-bg.wgsl / route-gl.js.

const ALTS = [0.0, 0.012, 0.128, 0.291, 0.442, 0.849, 1.0];
const TOPV = 0.72, RISEV = 0.42;

const hash = (x) => { const s = Math.sin(x * 127.1) * 43758.5453; return s - Math.floor(s); };
const vnoise = (x) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return hash(i) + (hash(i + 1) - hash(i)) * u;
};
const fbm = (x) => { let v = 0, a = 0.55; for (let i = 0; i < 4; i++) { v += a * vnoise(x); x = x * 2.07 + 11.3; a *= 0.5; } return v; };
const smooth = (f) => f * f * (3 - 2 * f);
const altAt = (u) => {
  const g = Math.min(1, Math.max(0, u)) * 6, i = Math.floor(g);
  if (i >= 6) return ALTS[6];
  return ALTS[i] + (ALTS[i + 1] - ALTS[i]) * smooth(g - i);
};
const curveV = (u) => TOPV - altAt(u) * RISEV + (fbm(u * 7 + 4) - 0.5) * 0.025;

export function activateRoute(section) {
  section.classList.add("gl");
  const wrap = section.querySelector(".line-wrap");
  const stops = [...section.querySelectorAll(".stop")];
  const mq = matchMedia("(min-width:641px)");

  const placeStops = () => {
    stops.forEach((s, i) => {
      if (mq.matches) {
        const u = (i + 0.5) / 7;
        s.style.left = u * 100 + "%";
        s.style.top = curveV(u) * 100 + "%";
      } else {
        s.style.left = "";
        s.style.top = "";
      }
    });
  };
  placeStops();
  mq.addEventListener("change", placeStops);
  new ResizeObserver(placeStops).observe(wrap);
  if (document.fonts?.ready) document.fonts.ready.then(placeStops);

  // chart rect in section-uv, stable across scroll (layout space, not viewport)
  const getRect = () => {
    const sr = section.getBoundingClientRect();
    const wr = wrap.getBoundingClientRect();
    return {
      x0: (wr.left - sr.left) / sr.width,
      x1: (wr.right - sr.left) / sr.width,
      y0: (wr.top - sr.top) / sr.height,
      y1: (wr.bottom - sr.top) / sr.height,
    };
  };
  const reset = () => {
    section.classList.remove("gl");
    stops.forEach((s) => { s.style.left = ""; s.style.top = ""; });
  };
  return { getRect, reset };
}
