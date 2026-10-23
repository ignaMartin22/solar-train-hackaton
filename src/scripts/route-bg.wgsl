// Route backdrop: night sky + quebrada ridgelines as atmosphere behind the
// server-rendered SVG map. The map itself carries the geography; this layer
// only sets the mood — no chart, no stops, no metrics.
// uv is top-origin (v grows downward).

struct Params {
  time: f32, width: f32, height: f32, prog: f32,
};
@group(0) @binding(0) var<uniform> params: Params;

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

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.time;
  let aspect = params.width / params.height;
  let par = (params.prog - 0.5) * 0.04; // gentle scroll parallax

  // night sky continuing the orbit shot: page-ground at the top edge melts into deep blue
  var col = mix(vec3f(0.043, 0.055, 0.075), vec3f(0.050, 0.075, 0.145), smoothstep(0.0, 0.75, uv.y));
  // last ember of the day, low on the right horizon — the sun already set on the ride
  let sun = vec2f(0.78 * aspect, 0.55);
  let dSun = distance(vec2f(uv.x * aspect, uv.y), sun);
  col += vec3f(0.55, 0.20, 0.10) * exp(-dSun * 6.0) * 0.14;
  col += vec3f(1.0, 0.55, 0.28) * exp(-dSun * 26.0) * 0.20;
  // stars: hashed points with a slow twinkle, denser higher in the sky
  let sg = uv * vec2f(aspect, 1.0) * 150.0;
  let sH = hash(floor(sg.x) * 61.7 + floor(sg.y) * 113.1);
  var star = (1.0 - smoothstep(0.03, 0.12, length(fract(sg) - 0.5))) * step(0.982, sH);
  star *= (0.55 + 0.45 * sin(t * (0.6 + sH * 2.4) + sH * 40.0)) * (1.0 - smoothstep(0.45, 0.9, uv.y));
  col += vec3f(0.88, 0.92, 1.0) * star * 0.8;
  // halftone dot field fading in the upper sky (brand puntillado)
  let cell = fract(uv * vec2f(aspect, 1.0) * 110.0) - 0.5;
  let dots = (1.0 - smoothstep(0.12, 0.18, length(cell))) * (1.0 - smoothstep(0.10, 0.40, uv.y)) * 0.035;
  col += vec3f(0.96, 0.94, 0.92) * dots;

  let x = uv.x;

  // back ridges — cold night blues, far to near
  let y3 = 0.58 - fbm(x * 1.6 + 7.0 + par * 0.4) * 0.12;
  if (uv.y > y3) { col = mix(col, vec3f(0.055, 0.082, 0.157), 0.9); }
  let y2 = 0.68 - fbm(x * 2.3 + 3.0 + par * 0.7) * 0.15;
  if (uv.y > y2) { col = mix(col, vec3f(0.040, 0.051, 0.094), 0.92); }
  // front silhouette with a faint moonlit rim on its crest
  let yf = 0.86 - fbm(x * 3.1 + 1.0 + par) * 0.14;
  if (uv.y > yf) {
    col = mix(col, vec3f(0.024, 0.031, 0.055), 0.97);
    col += vec3f(0.30, 0.38, 0.62) * (1.0 - smoothstep(0.0, 0.014, uv.y - yf)) * 0.22;
  }

  // melt the lower edge into the page ground for a seamless hand-off
  col = mix(col, vec3f(0.043, 0.055, 0.075), smoothstep(0.86, 1.0, uv.y));

  // dither against banding
  col += (hash(uv.x * 917.0 + uv.y * 531.7 + t) - 0.5) * 0.015;
  return vec4f(col, 1.0);
}
