// Liquid-metal orb: a single raymarched fragment shader (WebGL 1), no libraries.
// Monochrome studio reflections, pointer-reactive rotation, paused off-screen.
// Reduced motion and small screens get one rendered still frame instead of a loop.
import { env } from "./core.js";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPtr;
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float map(vec3 p){
  p.xz *= rot(uTime * 0.12 + uPtr.x * 0.7);
  p.yz *= rot(-uPtr.y * 0.5 + 0.2);
  float w = sin(p.x * 2.2 + uTime * 0.7) * sin(p.y * 2.0 + uTime * 0.5) * sin(p.z * 2.4 + uTime * 0.6);
  w += 0.3 * sin(p.y * 5.0 - uTime * 0.9) * sin(p.x * 4.0 + uTime * 0.4);
  return length(p) - 1.0 + w * 0.06;
}
vec3 nrm(vec3 p){
  vec2 e = vec2(0.0025, 0.0);
  return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));
}
vec3 envMap(vec3 r){
  // Chrome studio: graded grey sky, near-black floor, a bright horizon line and two softboxes.
  vec3 sky = mix(vec3(0.20, 0.205, 0.215), vec3(0.62, 0.63, 0.65), smoothstep(0.0, 1.0, r.y));
  vec3 floorC = mix(vec3(0.012, 0.013, 0.015), vec3(0.07, 0.072, 0.078), smoothstep(-1.0, 0.0, r.y));
  vec3 c = mix(floorC, sky, smoothstep(-0.02, 0.02, r.y));
  c += vec3(0.75) * smoothstep(0.06, 0.0, abs(r.y - 0.01));
  c += vec3(1.0) * smoothstep(0.93, 0.985, dot(r, normalize(vec3(-0.55, 0.62, 0.55)))) * 1.3;
  c += vec3(0.7) * smoothstep(0.06, 0.0, abs(r.x - 0.8)) * smoothstep(-0.1, 0.6, r.y);
  return c;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 ro = vec3(0.0, 0.0, 4.6), rd = normalize(vec3(uv, -1.6));
  float t = 0.0; float hit = 0.0;
  for (int i = 0; i < 72; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0012) { hit = 1.0; break; }
    t += d * 0.85;
    if (t > 7.0) break;
  }
  vec3 col = vec3(0.0);
  if (hit > 0.5) {
    vec3 p = ro + rd * t, n = nrm(p), r = reflect(rd, n);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col = envMap(r) * 0.9 + fres * vec3(0.22);
    col *= 0.82 + 0.18 * n.y;
  }
  float halo = smoothstep(0.49, 0.33, length(uv)) * 0.10;
  float a = hit;
  col = col * a + vec3(0.78) * halo * (1.0 - a);
  gl_FragColor = vec4(col, a + halo * (1.0 - a));
}`;

export function initOrb(host) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true, powerPreference: "low-power" });
  if (!gl) return false;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) { console.warn("Orb disabled:", err); return false; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "uRes"), uTime = gl.getUniformLocation(prog, "uTime"), uPtr = gl.getUniformLocation(prog, "uPtr");

  host.appendChild(canvas);
  host.classList.add("has-gl");
  const still = env.reduce || env.small();
  const scale = still ? 1 : 0.8;
  const resize = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5) * scale;
    canvas.width = Math.max(2, Math.round(r.width * dpr)); canvas.height = Math.max(2, Math.round(r.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();
  const draw = (t, px, py) => { gl.uniform1f(uTime, t); gl.uniform2f(uPtr, px, py); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  if (still) { draw(2.4, 0.15, -0.1); addEventListener("resize", () => { resize(); draw(2.4, 0.15, -0.1); }); return true; }

  let tx = 0, ty = 0, px = 0, py = 0, visible = true, raf = 0;
  addEventListener("pointermove", (e) => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });
  addEventListener("resize", resize);
  const t0 = performance.now();
  const loop = (now) => {
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    draw((now - t0) / 1000, px, py);
    raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
  };
  const resume = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; resume(); }).observe(host);
  document.addEventListener("visibilitychange", resume);
  resume();
  return true;
}
