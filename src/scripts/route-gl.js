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
uniform float uTime; uniform vec2 uRes; uniform float uProg;
in vec2 vUv;
out vec4 frag;

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

void main(){
  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);
  float t = uTime;
  float aspect = uRes.x / uRes.y;
  float par = (uProg - 0.5) * 0.04;

  vec3 col = mix(vec3(0.043, 0.055, 0.075), vec3(0.050, 0.075, 0.145), smoothstep(0.0, 0.75, uv.y));
  vec2 sun = vec2(0.78 * aspect, 0.55);
  float dSun = distance(vec2(uv.x * aspect, uv.y), sun);
  col += vec3(0.30, 0.36, 0.48) * exp(-dSun * 6.0) * 0.14;
  col += vec3(0.75, 0.82, 0.95) * exp(-dSun * 26.0) * 0.18;
  vec2 sg = uv * vec2(aspect, 1.0) * 150.0;
  float sH = hash(floor(sg.x) * 61.7 + floor(sg.y) * 113.1);
  float star = (1.0 - smoothstep(0.03, 0.12, length(fract(sg) - 0.5))) * step(0.982, sH);
  star *= (0.55 + 0.45 * sin(t * (0.6 + sH * 2.4) + sH * 40.0)) * (1.0 - smoothstep(0.45, 0.9, uv.y));
  col += vec3(0.88, 0.92, 1.0) * star * 0.8;
  vec2 cell = fract(uv * vec2(aspect, 1.0) * 110.0) - 0.5;
  float dots = (1.0 - smoothstep(0.12, 0.18, length(cell))) * (1.0 - smoothstep(0.10, 0.40, uv.y)) * 0.035;
  col += vec3(0.96, 0.94, 0.92) * dots;

  float x = uv.x;
  float y3 = 0.58 - fbm(x * 1.6 + 7.0 + par * 0.4) * 0.12;
  if (uv.y > y3) col = mix(col, vec3(0.055, 0.082, 0.157), 0.9);
  float y2 = 0.68 - fbm(x * 2.3 + 3.0 + par * 0.7) * 0.15;
  if (uv.y > y2) col = mix(col, vec3(0.040, 0.051, 0.094), 0.92);
  float yf = 0.86 - fbm(x * 3.1 + 1.0 + par) * 0.14;
  if (uv.y > yf){
    col = mix(col, vec3(0.024, 0.031, 0.055), 0.97);
    col += vec3(0.30, 0.38, 0.62) * (1.0 - smoothstep(0.0, 0.014, uv.y - yf)) * 0.22;
  }

  col = mix(col, vec3(0.043, 0.055, 0.075), smoothstep(0.86, 1.0, uv.y));
  col += (hash(uv.x * 917.0 + uv.y * 531.7 + t) - 0.5) * 0.015;
  frag = vec4(col, 1.0);
}`;

export function startGL(canvas, section, reduce) {
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

  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(uRes, w, h);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const draw = (t, prog) => {
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
