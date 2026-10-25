// Ticket foil: the holographic band along the bottom of the stub. Thin-film
// rainbow whose phase follows the ticket tilt (mx, my in -1..1), a silver base,
// topographic contour lines and glints that flash as the angle changes.
// Outside the band the canvas stays transparent (premultiplied alpha).
// uv is top-origin (v grows downward).

struct Params {
  time: f32, width: f32, height: f32, hover: f32,
  mx: f32, my: f32, pad0: f32, pad1: f32,
};
@group(0) @binding(0) var<uniform> params: Params;

fn hash2(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }

fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);
  let a = hash2(i);
  let b = hash2(i + vec2f(1.0, 0.0));
  let c = hash2(i + vec2f(0.0, 1.0));
  let d = hash2(i + vec2f(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn spectrum(h: f32) -> vec3f { return 0.5 + 0.5 * cos(6.28318 * (h + vec3f(0.0, 0.33, 0.67))); }

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let t = params.time;
  let aspect = params.width / max(params.height, 1.0);
  let p = vec2f(uv.x * aspect, uv.y);
  let tilt = vec2f(params.mx, params.my);

  // band top edge: a long, shallow wave that rises toward the coin
  let edge = 0.745 - 0.075 * smoothstep(0.30, 0.86, uv.x) + 0.010 * sin(uv.x * 11.0 + 0.6);
  let px = 1.0 / max(params.height, 1.0);
  let band = smoothstep(edge - px, edge + px, uv.y);
  if (band <= 0.0) { return vec4f(0.0); }

  let n = noise(p * 2.6 + vec2f(t * 0.04, 0.0));

  // thin-film phase: position + view angle, so the rainbow slides as the ticket tilts
  let phase = uv.x * 0.85 - uv.y * 0.9 + tilt.x * 0.6 + tilt.y * 0.4 + n * 0.4 + t * 0.015;
  // pastel film over silver: the reference foil reads silvery, never neon
  let rainbow = mix(spectrum(phase), vec3f(0.92, 0.93, 1.0), 0.32);

  // specular lobe: where the light catches the foil, following the pointer
  let lc = vec2f(0.5 + tilt.x * 0.55, 0.9 + tilt.y * 0.2);
  let d = (uv - lc) * vec2f(aspect * 0.7, 2.4);
  let lobe = exp(-dot(d, d) * 2.2);

  let silver = vec3f(0.66, 0.69, 0.82) + 0.05 * sin(p.y * 22.0 + n * 5.0);
  var foil = mix(silver, rainbow, 0.18 + 0.62 * lobe);
  foil *= 0.84 + 0.30 * lobe + 0.08 * params.hover;

  // topographic contour lines pressed into the foil
  let topo = fract((n * 1.8 + p.y * 0.9 + p.x * 0.12) * 16.0);
  foil += vec3f(0.92, 0.95, 1.0) * (1.0 - smoothstep(0.0, 0.06, abs(topo - 0.5))) * 0.09;

  // glints: sparse hashed cells that flash at specific angles
  let gp = p * 95.0;
  let h = hash2(floor(gp));
  let flash = pow(max(0.0, sin(h * 60.0 + tilt.x * 9.0 + tilt.y * 7.0 + t * 1.2)), 22.0);
  let spot = 1.0 - smoothstep(0.08, 0.42, length(fract(gp) - 0.5));
  foil += vec3f(1.0) * step(0.94, h) * flash * spot * (0.6 + 0.6 * params.hover);

  // bright rim where the foil meets the art
  let rim = exp(-max(uv.y - edge, 0.0) / px * 0.45);
  foil += mix(vec3f(1.0), rainbow, 0.5) * rim * 0.55;

  return vec4f(min(foil, vec3f(1.0)) * band, band);
}
