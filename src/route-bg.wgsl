// Route backdrop: quebrada ridgelines + the real elevation profile Volcán → Humahuaca
// as a glowing elevation chart inside the .line-wrap rect (passed as uWrap in section-uv).
// uv is top-origin (v grows downward).

struct Params {
  time: f32, width: f32, height: f32, prog: f32,
  x0: f32, x1: f32, y0: f32, y1: f32, // line-wrap rect in section uv
};
@group(0) @binding(0) var<uniform> params: Params;

// normalized altitude per stop (2080m → 2940m): Volcán, Tumbaya, Purmamarca,
// Maimará, Tilcara, Uquía, Humahuaca
const ALTS = array<f32, 7>(0.000, 0.012, 0.128, 0.291, 0.442, 0.849, 1.000);
const TOPV: f32 = 0.72;  // wrap-v of the lowest stop
const RISEV: f32 = 0.42; // wrap-v climbed end-to-end

fn hash(x: f32) -> f32 { return fract(sin(x * 127.1) * 43758.5453); }

fn vnoise(x: f32) -> f32 {
  let i = floor(x);
  let f = fract(x);
  let u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}

fn fbm(x: f32) -> f32 {
  var v = 0.0;
  var a = 0.55;
  var xx = x;
  for (var i = 0; i < 4; i += 1) {
    v += a * vnoise(xx);
    xx = xx * 2.07 + 11.3;
    a *= 0.5;
  }
  return v;
}

fn altAt(u: f32) -> f32 {
  let g = clamp(u, 0.0, 1.0) * 6.0;
  let i = i32(floor(g));
  let f = smoothstep(0.0, 1.0, g - f32(i));
  if (i >= 6) { return ALTS[6]; }
  return mix(ALTS[i], ALTS[i + 1], f);
}

// elevation profile in wrap-space v (v down)
fn curveV(u: f32) -> f32 {
  return TOPV - altAt(u) * RISEV + (fbm(u * 7.0 + 4.0) - 0.5) * 0.025;
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.time;
  let aspect = params.width / params.height;
  let par = (params.prog - 0.5) * 0.04; // gentle scroll parallax

  // dusk sky, page-ground at the top edge so the section melts into --ground
  var col = mix(vec3f(0.043, 0.055, 0.075), vec3f(0.075, 0.106, 0.176), smoothstep(0.0, 0.8, uv.y));
  // low warm band on the horizon + sun glow
  let sun = vec2f(0.70 * aspect, 0.60);
  let dSun = distance(vec2f(uv.x * aspect, uv.y), sun);
  col += vec3f(0.79, 0.31, 0.16) * exp(-dSun * 4.5) * 0.35;
  col += vec3f(1.0, 0.54, 0.30) * exp(-dSun * 14.0) * 0.55;
  // halftone dot field fading in the upper sky (brand puntillado)
  let cell = fract(uv * vec2f(aspect, 1.0) * 110.0) - 0.5;
  let dots = (1.0 - smoothstep(0.12, 0.18, length(cell))) * (1.0 - smoothstep(0.15, 0.55, uv.y)) * 0.05;
  col += vec3f(0.96, 0.94, 0.92) * dots;

  let x = uv.x;

  // back ridges
  let y3 = 0.58 - fbm(x * 1.6 + 7.0 + par * 0.4) * 0.12;
  if (uv.y > y3) { col = mix(col, vec3f(0.14, 0.18, 0.29), 0.85); }
  let y2 = 0.68 - fbm(x * 2.3 + 3.0 + par * 0.7) * 0.15;
  if (uv.y > y2) { col = mix(col, vec3f(0.23, 0.165, 0.153), 0.9); }
  // front silhouette
  let yf = 0.86 - fbm(x * 3.1 + 1.0 + par) * 0.14;
  if (uv.y > yf) {
    col = mix(col, vec3f(0.075, 0.086, 0.122), 0.96);
    col += vec3f(0.79, 0.31, 0.16) * (1.0 - smoothstep(0.0, 0.012, uv.y - yf)) * 0.35;
  }

  // elevation chart inside the wrap rect
  let wu = (x - params.x0) / (params.x1 - params.x0);
  let wv = (uv.y - params.y0) / (params.y1 - params.y0);
  let chartMask = smoothstep(-0.02, 0.01, wu) * (1.0 - smoothstep(0.99, 1.02, wu));
  let cy = params.y0 + curveV(wu) * (params.y1 - params.y0);
  let dLine = abs(uv.y - cy);
  var glow = (exp(-dLine * 300.0) * 1.0 + exp(-dLine * 45.0) * 0.25) * chartMask;
  // soft area under the curve
  if (uv.y > cy && wv < 1.0) {
    col += vec3f(1.0, 0.353, 0.122) * (1.0 - smoothstep(0.0, 0.25, uv.y - cy)) * 0.10 * chartMask;
  }
  // faint hairline along the chart floor (telemetry baseline)
  glow += (1.0 - smoothstep(0.0, 0.0018, abs(uv.y - params.y1))) * chartMask * 0.10;

  // station beacons: core + radar ping ring + a pin stem down to the baseline
  for (var i = 0; i < 7; i += 1) {
    let su = (f32(i) + 0.5) / 7.0;
    let sx = params.x0 + su * (params.x1 - params.x0);
    let sy = params.y0 + curveV(su) * (params.y1 - params.y0);
    let d = distance(vec2f(x * aspect, uv.y), vec2f(sx * aspect, sy));
    glow += (exp(-d * 140.0) * 0.9 + exp(-d * 24.0) * 0.16 * (0.7 + 0.3 * sin(t * 2.0 + f32(i) * 1.7))) * chartMask;
    let ping = fract(t * 0.22 + f32(i) * 0.37);
    let pingR = 0.006 + ping * 0.05;
    glow += (1.0 - smoothstep(0.0, 0.0035, abs(d - pingR))) * (1.0 - ping) * 0.45 * chartMask;
    let stemX = abs(x - sx) * aspect;
    glow += (1.0 - smoothstep(0.0, 0.0016, stemX)) * step(sy + 0.004, uv.y) * (1.0 - smoothstep(sy, params.y1, uv.y)) * 0.12 * chartMask;
  }

  // the train: a bright pulse travelling the route, with a short trail
  let ut = fract(t * 0.055);
  let xt = params.x0 + ut * (params.x1 - params.x0);
  let yt = params.y0 + curveV(ut) * (params.y1 - params.y0);
  let dT = distance(vec2f(x * aspect, uv.y), vec2f(xt * aspect, yt));
  let trail = step(wu, ut) * exp(-(ut - wu) * 8.0) * exp(-dLine * 140.0) * 0.8;
  glow += (exp(-dT * 90.0) * 1.6 + exp(-dT * 18.0) * 0.35 + trail) * chartMask;

  col += vec3f(1.0, 0.353, 0.122) * glow;

  // melt the lower edge into the page ground for a seamless hand-off
  col = mix(col, vec3f(0.043, 0.055, 0.075), smoothstep(0.86, 1.0, uv.y));

  // dither against banding
  col += (hash(uv.x * 917.0 + uv.y * 531.7 + t) - 0.5) * 0.015;
  return vec4f(col, 1.0);
}
