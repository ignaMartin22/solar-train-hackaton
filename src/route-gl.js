// WebGL2 fallback for the route backdrop — same shader math as route-bg.wgsl,
// for browsers without WebGPU (Firefox, older Safari). Returns true if running.

const VERT = `#version 300 es
out vec2 vUv;
void main(){
  vec2 p = vec2(gl_VertexID==1 ? 3.0 : -1.0, gl_VertexID==2 ? 3.0 : -1.0);
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
uniform float uTime; uniform vec2 uRes; uniform float uProg; uniform vec4 uWrap;
in vec2 vUv;
out vec4 frag;

const float TOPV = 0.72;
const float RISEV = 0.42;
float ALTS[7];

float hash(float x){ return fract(sin(x * 127.1) * 43758.5453); }
float vnoise(float x){
  float i = floor(x), f = fract(x), u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}
float fbm(float x){
  float v = 0.0, a = 0.55, xx = x;
  for (int i = 0; i < 4; i++){ v += a * vnoise(xx); xx = xx * 2.07 + 11.3; a *= 0.5; }
  return v;
}
float altAt(float u){
  float g = clamp(u, 0.0, 1.0) * 6.0;
  int i = int(floor(g));
  float f = smoothstep(0.0, 1.0, g - float(i));
  if (i >= 6) return ALTS[6];
  return mix(ALTS[i], ALTS[i + 1], f);
}
float curveV(float u){
  return TOPV - altAt(u) * RISEV + (fbm(u * 7.0 + 4.0) - 0.5) * 0.025;
}

void main(){
  ALTS[0]=0.000;ALTS[1]=0.012;ALTS[2]=0.128;ALTS[3]=0.291;ALTS[4]=0.442;ALTS[5]=0.849;ALTS[6]=1.000;
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float t = uTime;
  float aspect = uRes.x / uRes.y;
  float par = (uProg - 0.5) * 0.04;

  vec3 col = mix(vec3(0.043, 0.055, 0.075), vec3(0.075, 0.106, 0.176), smoothstep(0.0, 0.8, uv.y));
  vec2 sun = vec2(0.70 * aspect, 0.60);
  float dSun = distance(vec2(uv.x * aspect, uv.y), sun);
  col += vec3(0.79, 0.31, 0.16) * exp(-dSun * 4.5) * 0.35;
  col += vec3(1.0, 0.54, 0.30) * exp(-dSun * 14.0) * 0.55;
  vec2 cell = fract(uv * vec2(aspect, 1.0) * 110.0) - 0.5;
  float dots = (1.0 - smoothstep(0.12, 0.18, length(cell))) * (1.0 - smoothstep(0.15, 0.55, uv.y)) * 0.05;
  col += vec3(0.96, 0.94, 0.92) * dots;

  float x = uv.x;
  float y3 = 0.58 - fbm(x * 1.6 + 7.0 + par * 0.4) * 0.12;
  if (uv.y > y3) col = mix(col, vec3(0.14, 0.18, 0.29), 0.85);
  float y2 = 0.68 - fbm(x * 2.3 + 3.0 + par * 0.7) * 0.15;
  if (uv.y > y2) col = mix(col, vec3(0.23, 0.165, 0.153), 0.9);
  float yf = 0.86 - fbm(x * 3.1 + 1.0 + par) * 0.14;
  if (uv.y > yf){
    col = mix(col, vec3(0.075, 0.086, 0.122), 0.96);
    col += vec3(0.79, 0.31, 0.16) * (1.0 - smoothstep(0.0, 0.012, uv.y - yf)) * 0.35;
  }

  float wu = (x - uWrap.x) / (uWrap.y - uWrap.x);
  float wv = (uv.y - uWrap.z) / (uWrap.w - uWrap.z);
  float chartMask = smoothstep(-0.02, 0.01, wu) * (1.0 - smoothstep(0.99, 1.02, wu));
  float cy = uWrap.z + curveV(wu) * (uWrap.w - uWrap.z);
  float dLine = abs(uv.y - cy);
  float glow = (exp(-dLine * 300.0) * 1.0 + exp(-dLine * 45.0) * 0.25) * chartMask;
  if (uv.y > cy && wv < 1.0){
    col += vec3(1.0, 0.353, 0.122) * (1.0 - smoothstep(0.0, 0.25, uv.y - cy)) * 0.10 * chartMask;
  }
  glow += (1.0 - smoothstep(0.0, 0.0018, abs(uv.y - uWrap.w))) * chartMask * 0.10;

  for (int i = 0; i < 7; i++){
    float su = (float(i) + 0.5) / 7.0;
    float sx = uWrap.x + su * (uWrap.y - uWrap.x);
    float sy = uWrap.z + curveV(su) * (uWrap.w - uWrap.z);
    float d = distance(vec2(x * aspect, uv.y), vec2(sx * aspect, sy));
    glow += (exp(-d * 140.0) * 0.9 + exp(-d * 24.0) * 0.16 * (0.7 + 0.3 * sin(t * 2.0 + float(i) * 1.7))) * chartMask;
    float ping = fract(t * 0.22 + float(i) * 0.37);
    float pingR = 0.006 + ping * 0.05;
    glow += (1.0 - smoothstep(0.0, 0.0035, abs(d - pingR))) * (1.0 - ping) * 0.45 * chartMask;
    float stemX = abs(x - sx) * aspect;
    glow += (1.0 - smoothstep(0.0, 0.0016, stemX)) * step(sy + 0.004, uv.y) * (1.0 - smoothstep(sy, uWrap.w, uv.y)) * 0.12 * chartMask;
  }

  float ut = fract(t * 0.055);
  float xt = uWrap.x + ut * (uWrap.y - uWrap.x);
  float yt = uWrap.z + curveV(ut) * (uWrap.w - uWrap.z);
  float dT = distance(vec2(x * aspect, uv.y), vec2(xt * aspect, yt));
  float trail = step(wu, ut) * exp(-(ut - wu) * 8.0) * exp(-dLine * 140.0) * 0.8;
  glow += (exp(-dT * 90.0) * 1.6 + exp(-dT * 18.0) * 0.35 + trail) * chartMask;

  col += vec3(1.0, 0.353, 0.122) * glow;
  col = mix(col, vec3(0.043, 0.055, 0.075), smoothstep(0.86, 1.0, uv.y));
  col += (hash(uv.x * 917.0 + uv.y * 531.7 + t) - 0.5) * 0.015;
  frag = vec4(col, 1.0);
}`;

export function startGL(canvas, section, reduce, getWrapRect) {
  const gl = canvas.getContext("webgl2");
  if (!gl) return false;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uProg = gl.getUniformLocation(prog, "uProg");
  const uWrap = gl.getUniformLocation(prog, "uWrap");

  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uRes, w, h);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const draw = (t, prog) => {
    const r = getWrapRect();
    gl.uniform4f(uWrap, r.x0, r.x1, r.y0, r.y1);
    gl.uniform1f(uTime, t); gl.uniform1f(uProg, prog);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  if (reduce) { draw(0, 0.5); return true; }

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 }).observe(section);
  const t0 = performance.now();
  const tick = () => {
    if (visible) {
      const r = section.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
      draw((performance.now() - t0) / 1000, prog);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return true;
}
