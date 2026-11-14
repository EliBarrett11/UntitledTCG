// The WebGL2 renderer of the effects layer (stage V1). Hand-written, no libraries.
//
// - Particles are GPU particles: each one is written once, when it is born (where, its velocity, gravity,
//   drag, spin, size and colour over life), and the vertex shader works out where it is at any moment.
//   There is one pool per texture, drawn with that texture's blend: "light" adds, "alpha" is drawn normally.
//   A sprite is just a particle that doesn't move.
// - Ribbons are strips along a curved path that draw themselves from tail to head (the Renown ribbon, trails).
// - Everything is drawn into an off-screen buffer, then bloom (a blurred copy added back) and a distortion
//   pass (shockwave rings and heat shimmer) put it on the canvas. Light leaves the canvas's alpha at 0, so it
//   adds over the board beneath; solid pieces cover it.
// - Effect time can be frozen (hit-stop). The render loop runs only while something is alive.
//
// Coordinates are stage pixels (1920×1080); times are ms of effect time.

const STAGE_W = 1920;
const STAGE_H = 1080;
const FLOATS = 32;   // per particle: 8 vec4s

const PARTICLE_VS = `#version 300 es
layout(location=0) in vec2 corner;
layout(location=1) in vec4 a0; // x, y, vx, vy
layout(location=2) in vec4 a1; // gx, gy, drag, t0
layout(location=3) in vec4 a2; // life, w, h, scaleEnd
layout(location=4) in vec4 a3; // rot, spin, fadeIn, fadeOut
layout(location=5) in vec4 a4; // uv rect
layout(location=6) in vec4 a5; // colour at birth (rgb tint, alpha)
layout(location=7) in vec4 a6; // colour at death
layout(location=8) in vec4 a7; // align to velocity, tint amount, size curve, squash
uniform float uTime;
out vec2 vUv;
out vec4 vCol;
out float vTint;
void main() {
  float t = (uTime - a1.w) / 1000.0;
  float life = a2.x / 1000.0;
  float k = t / life;
  if (t < 0.0 || k >= 1.0) { gl_Position = vec4(3.0, 3.0, 3.0, 1.0); vUv = vec2(0.0); vCol = vec4(0.0); vTint = 0.0; return; }
  vec2 v0 = a0.zw; vec2 g = a1.xy; float d = a1.z;
  vec2 pos; vec2 vel;
  if (d > 0.001) { float e = exp(-d * t); pos = a0.xy + (v0 - g / d) * (1.0 - e) / d + g * t / d; vel = (v0 - g / d) * e + g / d; }
  else { pos = a0.xy + v0 * t + 0.5 * g * t * t; vel = v0 + g * t; }
  float curve = a7.z < 0.5 ? k : (a7.z < 1.5 ? 1.0 - (1.0 - k) * (1.0 - k) : (k < 0.15 ? k / 0.15 * 1.15 : 1.15 - 0.15 * (k - 0.15) / 0.85));
  float s = a7.z > 1.5 ? curve * a2.w : mix(1.0, a2.w, curve);
  float rot = a3.x + a3.y * t;
  if (a7.x > 0.5 && length(vel) > 1.0) rot = atan(vel.y, vel.x) + a3.x;
  vec2 c = corner * vec2(a2.y, a2.z) * s;
  float cs = cos(rot); float sn = sin(rot);
  c = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
  vec2 p = pos + c;
  gl_Position = vec4(p.x / ${STAGE_W}.0 * 2.0 - 1.0, 1.0 - p.y / ${STAGE_H}.0 * 2.0, 0.0, 1.0);
  vUv = a4.xy + (corner + 0.5) * a4.zw;
  float fi = a3.z > 0.0 ? clamp(k / a3.z, 0.0, 1.0) : 1.0;
  float fo = k > a3.w ? 1.0 - (k - a3.w) / max(0.0001, 1.0 - a3.w) : 1.0;
  vCol = mix(a5, a6, k);
  vCol.a *= fi * fo;
  vTint = a7.y;
}`;

const PARTICLE_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uLight;
in vec2 vUv;
in vec4 vCol;
in float vTint;
out vec4 o;
void main() {
  vec4 t = texture(uTex, vUv);   // premultiplied
  if (uLight > 0.5) {
    float l = max(t.r, max(t.g, t.b));
    vec3 hue = vCol.rgb / max(0.0001, max(vCol.r, max(vCol.g, vCol.b)));
    vec3 tinted = l * hue + pow(l, 4.0) * 0.55 * (1.0 - hue);
    o = vec4(mix(t.rgb, tinted, vTint) * vCol.a, 0.0);
  } else {
    o = vec4(t.rgb * mix(vec3(1.0), vCol.rgb, vTint), t.a) * vCol.a;
  }
}`;

const RIBBON_VS = `#version 300 es
layout(location=0) in vec2 pos;
layout(location=1) in vec2 sv;   // s along the path (0..1), side (-1..1)
uniform float uHead;
uniform float uTail;
out vec2 vUv;
out float vS;
void main() {
  gl_Position = vec4(pos.x / ${STAGE_W}.0 * 2.0 - 1.0, 1.0 - pos.y / ${STAGE_H}.0 * 2.0, 0.0, 1.0);
  float span = max(0.0001, uHead - uTail);
  vUv = vec2((sv.x - uTail) / span, sv.y * 0.5 + 0.5);
  vS = sv.x;
}`;
const RIBBON_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec4 uCol;
uniform float uHead;
uniform float uTail;
uniform float uTint;
in vec2 vUv;
in float vS;
out vec4 o;
void main() {
  if (vS > uHead || vS < uTail) discard;
  vec4 t = texture(uTex, clamp(vUv, vec2(0.0), vec2(1.0)));
  float l = max(t.r, max(t.g, t.b));
  vec3 hue = uCol.rgb / max(0.0001, max(uCol.r, max(uCol.g, uCol.b)));
  vec3 tinted = l * hue + pow(l, 4.0) * 0.6 * (1.0 - hue);
  float edge = smoothstep(0.0, 0.08, vUv.x) ;
  o = vec4(mix(t.rgb, tinted, uTint) * uCol.a * edge, 0.0);
}`;

const QUAD_VS = `#version 300 es
layout(location=0) in vec2 corner;
out vec2 vUv;
void main() { vUv = corner + 0.5; gl_Position = vec4(corner * 2.0, 0.0, 1.0); }`;
// A 9-tap Gaussian blur along one direction (5 linear-filtered taps).
const BLUR_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uDir;
in vec2 vUv;
out vec4 o;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 0.2270270270;
  c += texture(uTex, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture(uTex, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture(uTex, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  o = vec4(c, 1.0);
}`;
// The last pass: distortion, then the scene plus its bloom.
const COMPOSITE_FS = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomK;
uniform vec4 uWave[4];    // x, y (stage px), radius, strength
uniform float uWaveW[4];
uniform vec4 uHeat;       // x, y, radius, strength
uniform float uTime;
in vec2 vUv;
out vec4 o;
void main() {
  vec2 p = vec2(vUv.x * ${STAGE_W}.0, (1.0 - vUv.y) * ${STAGE_H}.0);
  vec2 off = vec2(0.0);
  for (int i = 0; i < 4; i++) {
    vec4 w = uWave[i];
    if (w.w == 0.0) continue;
    vec2 d = p - w.xy;
    float r = length(d);
    float ring = exp(-pow((r - w.z) / uWaveW[i], 2.0));
    off += (d / max(r, 1.0)) * ring * w.w;
  }
  if (uHeat.w > 0.0) {
    float r = length(p - uHeat.xy);
    float k = smoothstep(uHeat.z, 0.0, r) * uHeat.w;
    off += vec2(sin(p.y * 0.07 + uTime * 0.011), cos(p.x * 0.05 + uTime * 0.009)) * k;
  }
  vec2 uv = vUv - vec2(off.x / ${STAGE_W}.0, -off.y / ${STAGE_H}.0);
  vec4 s = texture(uScene, uv);
  vec3 b = texture(uBloom, vUv).rgb * uBloomK;
  o = vec4(s.rgb + b, s.a);
}`;

function compile(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
    gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}

// Returns null if WebGL2 can't be used here (the caller then falls back to the 2D animations).
export function createRenderer(canvas, { onFrame } = {}) {
  let gl;
  try { gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' }); } catch { gl = null; }
  if (!gl) return null;
  let progs;
  try {
    progs = { particle: compile(gl, PARTICLE_VS, PARTICLE_FS), ribbon: compile(gl, RIBBON_VS, RIBBON_FS), blur: compile(gl, QUAD_VS, BLUR_FS), composite: compile(gl, QUAD_VS, COMPOSITE_FS) };
  } catch (err) { console.warn('effects layer: shaders failed, using the 2D animations', err); return null; }
  const hdr = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');

  // A unit quad (two triangles) shared by particles and full-screen passes.
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]), gl.STATIC_DRAW);
  const quadVao = gl.createVertexArray();
  gl.bindVertexArray(quadVao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  // --- Effect time (frozen during hit-stop) ------------------------------------------------------------
  let frozenAt = null;
  let frozenTotal = 0;
  let freezeUntil = 0;
  const realNow = () => performance.now();
  const now = () => (frozenAt !== null ? frozenAt : realNow() - frozenTotal);
  function freeze(ms) {
    if (ms <= 0) return;
    if (frozenAt === null) frozenAt = realNow() - frozenTotal;
    freezeUntil = Math.max(freezeUntil, realNow() + ms);
    wake();
  }
  function thaw() {
    if (frozenAt === null) return;
    frozenTotal = realNow() - frozenAt;
    frozenAt = null;
  }

  // --- Textures -----------------------------------------------------------------------------------------
  const textures = new Map();   // id -> { tex, blend, frames: [[u,v,w,h]], aspect, real }
  function upload(id, source, { blend, frames, w, h, real }) {
    const old = textures.get(id);
    const tex = old?.tex ?? gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fr = (frames ?? [{ x: 0, y: 0, w, h }]).map((f) => [f.x / w, f.y / h, f.w / w, f.h / h, f.w / f.h]);
    textures.set(id, { tex, blend, frames: fr, aspect: w / h, real: !!real });
  }

  // --- Particle pools (one per texture) ----------------------------------------------------------------------
  const pools = new Map();
  function pool(id) {
    let pl = pools.get(id);
    if (pl) return pl;
    const cap = 256;
    pl = { id, cap, data: new Float32Array(cap * FLOATS), head: 0, deathAt: 0, buf: gl.createBuffer(), vao: gl.createVertexArray(), dirtyFrom: Infinity, dirtyTo: -1, groups: new Map() };
    setupPool(pl);
    pools.set(id, pl);
    return pl;
  }
  function setupPool(pl) {
    gl.bindVertexArray(pl.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, pl.buf);
    gl.bufferData(gl.ARRAY_BUFFER, pl.data.byteLength, gl.DYNAMIC_DRAW);
    for (let i = 0; i < 8; i++) {
      gl.enableVertexAttribArray(1 + i);
      gl.vertexAttribPointer(1 + i, 4, gl.FLOAT, false, FLOATS * 4, i * 16);
      gl.vertexAttribDivisor(1 + i, 1);
    }
    gl.bindVertexArray(null);
    pl.dirtyFrom = 0; pl.dirtyTo = pl.cap - 1;
  }
  function grow(pl) {
    if (pl.cap >= 4096) return false;
    const data = new Float32Array(pl.cap * 2 * FLOATS);
    data.set(pl.data);
    pl.data = data;
    pl.cap *= 2;
    setupPool(pl);
    return true;
  }
  // Writes one particle. p: { x, y, vx, vy, gx, gy, drag, life, w, h, scaleEnd, rot, spin, fadeIn, fadeOut,
  // frame, col0 [r,g,b,a], col1, align, tint, curve, delay }. Returns its slot.
  function spawn(id, p, group) {
    const pl = pool(id);
    const t = now() + (p.delay ?? 0);
    // Reuse a dead slot at the head; grow if the head is still alive.
    let i = pl.head;
    const alive = (j) => { const o = j * FLOATS; return pl.data[o + 7] + pl.data[o + 8] > now(); };
    if (alive(i)) { if (grow(pl)) i = pl.cap / 2; }
    pl.head = (i + 1) % pl.cap;
    const o = i * FLOATS;
    const d = pl.data;
    const tx = textures.get(id);
    const fr = tx ? tx.frames[(p.frame ?? 0) % tx.frames.length] : [0, 0, 1, 1, 1];
    const c0 = p.col0 ?? [1, 1, 1, 1]; const c1 = p.col1 ?? c0;
    d[o] = p.x; d[o + 1] = p.y; d[o + 2] = p.vx ?? 0; d[o + 3] = p.vy ?? 0;
    d[o + 4] = p.gx ?? 0; d[o + 5] = p.gy ?? 0; d[o + 6] = p.drag ?? 0; d[o + 7] = t;
    d[o + 8] = Math.max(1, p.life); d[o + 9] = p.w; d[o + 10] = p.h ?? p.w; d[o + 11] = p.scaleEnd ?? 1;
    d[o + 12] = p.rot ?? 0; d[o + 13] = p.spin ?? 0; d[o + 14] = p.fadeIn ?? 0; d[o + 15] = p.fadeOut ?? 0.6;
    d[o + 16] = fr[0]; d[o + 17] = fr[1]; d[o + 18] = fr[2]; d[o + 19] = fr[3];
    d.set(c0, o + 20); d.set(c1, o + 24);
    d[o + 28] = p.align ? 1 : 0; d[o + 29] = p.tint ?? 0; d[o + 30] = p.curve ?? 0; d[o + 31] = 0;
    pl.dirtyFrom = Math.min(pl.dirtyFrom, i); pl.dirtyTo = Math.max(pl.dirtyTo, i);
    pl.deathAt = Math.max(pl.deathAt, t + p.life);
    if (group != null) { if (!pl.groups.has(group)) pl.groups.set(group, []); pl.groups.get(group).push(i); }
    wake();
    return i;
  }
  // The frame aspect (w/h) of a texture's frame, for sizing.
  const frameAspect = (id, frame = 0) => { const tx = textures.get(id); return tx ? tx.frames[frame % tx.frames.length][4] : 1; };
  const frameCount = (id) => textures.get(id)?.frames.length ?? 1;

  // --- Ribbons -------------------------------------------------------------------------------------------------
  const ribbons = [];
  // A ribbon along a quadratic curve from a to b (bend: how far the middle bows, in px). It draws from tail
  // to head over `travel` ms, then the tail catches up over `lag` ms.
  function ribbon(id, { from, to, bend = 0, width = 40, travel = 500, lag = 300, col = [1, 1, 1, 1], tint = 0, delay = 0 }, group) {
    const N = 40;
    const mx = (from.x + to.x) / 2; const my = (from.y + to.y) / 2;
    const dx = to.x - from.x; const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len; const ny = dx / len;
    const cx = mx + nx * bend; const cy = my + ny * bend;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const x = (1 - s) * (1 - s) * from.x + 2 * (1 - s) * s * cx + s * s * to.x;
      const y = (1 - s) * (1 - s) * from.y + 2 * (1 - s) * s * cy + s * s * to.y;
      pts.push([x, y, s]);
    }
    const verts = new Float32Array((N + 1) * 2 * 4);
    for (let i = 0; i <= N; i++) {
      const a = pts[Math.max(0, i - 1)]; const b = pts[Math.min(N, i + 1)];
      let tx = b[0] - a[0]; let ty = b[1] - a[1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = width / 2;
      const [x, y, s] = pts[i];
      verts.set([x - ty * w, y + tx * w, s, -1, x + ty * w, y - tx * w, s, 1], i * 8);
    }
    const vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    const t0 = now() + delay;
    const r = { id, vao, buf, count: (N + 1) * 2, t0, travel, lag, col, tint, end: t0 + travel + lag, group };
    ribbons.push(r);
    wake();
    // Where the head is at time t (for motes that follow it).
    return (s) => { const i = Math.round(Math.max(0, Math.min(1, s)) * N); return { x: pts[i][0], y: pts[i][1] }; };
  }

  // --- Distortion waves and heat ---------------------------------------------------------------------------------
  const waves = [];
  function wave({ x, y, radius = 220, width = 26, strength = 9, dur = 450, delay = 0 }) {
    waves.push({ x, y, radius, width, strength, t0: now() + delay, dur });
    if (waves.length > 4) waves.shift();
    wake();
  }
  let heat = null;
  function shimmer({ x, y, radius = 160, strength = 3, dur = 600 }) { heat = { x, y, radius, strength, t0: now(), dur }; wake(); }

  // --- Bloom flash -----------------------------------------------------------------------------------------------
  let flashK = 0; let flashT0 = 0; let flashDur = 1;
  function flash(k = 1, dur = 200) { flashK = k; flashT0 = now(); flashDur = dur; wake(); }

  // --- Emitters (spawn over time, on the CPU) ------------------------------------------------------------------------
  const emitters = [];
  function emitter(e) { emitters.push({ ...e, t0: now() + (e.delay ?? 0), acc: 0, last: now() + (e.delay ?? 0) }); wake(); }

  // Ends a group's effects quickly (a skipped beat): particles fade within ~120 ms, emitters and ribbons stop.
  function kill(group) {
    const t = now();
    for (const pl of pools.values()) {
      const slots = pl.groups.get(group);
      if (!slots) continue;
      for (const i of slots) {
        const o = i * FLOATS;
        const born = pl.data[o + 7];
        const life = pl.data[o + 8];
        if (born + life <= t) continue;
        if (born > t) { pl.data[o + 8] = 1; pl.data[o + 7] = t - 2; continue; }
        const left = Math.min(born + life, t + 120);
        pl.data[o + 8] = Math.max(1, left - born);
        pl.data[o + 15] = Math.min(pl.data[o + 15], (t - born) / pl.data[o + 8]);
        pl.dirtyFrom = Math.min(pl.dirtyFrom, i); pl.dirtyTo = Math.max(pl.dirtyTo, i);
      }
      pl.groups.delete(group);
    }
    for (let i = emitters.length - 1; i >= 0; i--) if (emitters[i].group === group) emitters.splice(i, 1);
    for (const r of ribbons) if (r.group === group && r.end > t) { r.end = t + 120; r.killT = t; }
  }
  // Forget group bookkeeping that is no longer needed.
  function release(group) { for (const pl of pools.values()) pl.groups.delete(group); }

  // --- Frame buffers ---------------------------------------------------------------------------------------------
  let W = 0; let H = 0; let bw = 0; let bh = 0;
  let scene = null; let bloomA = null; let bloomB = null;
  function target(w, h, float) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (float) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok && float) { gl.deleteTexture(tex); gl.deleteFramebuffer(fb); return target(w, h, false); }
    return { tex, fb, w, h };
  }
  function freeTarget(t) { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); } }
  function resize(w, h) {
    w = Math.max(2, Math.round(w)); h = Math.max(2, Math.round(h));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    freeTarget(scene); freeTarget(bloomA); freeTarget(bloomB);
    scene = target(W, H, hdr);
    bw = Math.max(2, Math.round(W / 4)); bh = Math.max(2, Math.round(H / 4));
    bloomA = target(bw, bh, hdr); bloomB = target(bw, bh, hdr);
    wake();
  }

  // --- Drawing ---------------------------------------------------------------------------------------------------------
  let raf = 0;
  let running = false;
  let lowMotion = false;
  let bloomBase = 0.9;
  let frames = 0;
  const frameTimes = [];
  let lastFrame = 0;
  function aliveAt(t) {
    if (frozenAt !== null) return true;
    if (emitters.length) return true;
    for (const pl of pools.values()) if (pl.deathAt > t) return true;
    if (ribbons.some((r) => r.end > t)) return true;
    if (waves.some((w) => w.t0 + w.dur > t)) return true;
    if (heat && heat.t0 + heat.dur > t) return true;
    if (onFrame?.alive?.()) return true;
    return false;
  }
  function wake() {
    if (running) return;
    running = true;
    lastFrame = 0;
    raf = requestAnimationFrame(frame);
  }
  function tickEmitters(t) {
    for (let i = emitters.length - 1; i >= 0; i--) {
      const e = emitters[i];
      if (t < e.t0) continue;
      const end = e.t0 + e.dur;
      const upto = Math.min(t, end);
      e.acc += ((upto - e.last) / 1000) * e.rate;
      e.last = upto;
      while (e.acc >= 1) {
        e.acc -= 1;
        const k = (upto - e.t0) / e.dur;
        e.spawn(k, e.group);
      }
      if (t >= end) emitters.splice(i, 1);
    }
  }
  function frame(ts) {
    raf = 0;
    if (frozenAt !== null && realNow() >= freezeUntil) thaw();
    const t = now();
    if (lastFrame) { frameTimes.push(ts - lastFrame); if (frameTimes.length > 4000) frameTimes.shift(); }
    lastFrame = ts;
    onFrame?.tick?.(t);
    if (frozenAt === null) tickEmitters(t);
    const alive = aliveAt(t);
    render(t);
    frames += 1;
    if (alive) { raf = requestAnimationFrame(frame); return; }
    running = false;
    // Nothing left: clear once and stop.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (let i = ribbons.length - 1; i >= 0; i--) { gl.deleteBuffer(ribbons[i].buf); gl.deleteVertexArray(ribbons[i].vao); ribbons.splice(i, 1); }
    for (const pl of pools.values()) pl.groups.clear();
  }
  function blendLight() { gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE); }
  function blendAlpha() { gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
  function render(t) {
    if (!scene) return;
    // 1. The effects into the scene buffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    const P = progs.particle;
    gl.useProgram(P.p);
    gl.uniform1f(P.u.uTime, t);
    gl.uniform1i(P.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    for (const pass of ['alpha', 'light']) {
      if (pass === 'alpha') blendAlpha(); else blendLight();
      gl.uniform1f(P.u.uLight, pass === 'light' ? 1 : 0);
      for (const pl of pools.values()) {
        if (pl.deathAt <= t) continue;
        const tx = textures.get(pl.id);
        if (!tx || tx.blend !== pass) continue;
        if (pl.dirtyTo >= pl.dirtyFrom) {
          gl.bindBuffer(gl.ARRAY_BUFFER, pl.buf);
          gl.bufferSubData(gl.ARRAY_BUFFER, pl.dirtyFrom * FLOATS * 4, pl.data, pl.dirtyFrom * FLOATS, (pl.dirtyTo - pl.dirtyFrom + 1) * FLOATS);
          pl.dirtyFrom = Infinity; pl.dirtyTo = -1;
        }
        gl.bindTexture(gl.TEXTURE_2D, tx.tex);
        gl.bindVertexArray(pl.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, pl.cap);
      }
    }
    // Ribbons.
    const R = progs.ribbon;
    gl.useProgram(R.p);
    gl.uniform1i(R.u.uTex, 0);
    blendLight();
    for (const r of ribbons) {
      if (t < r.t0 || t > r.end) continue;
      const tx = textures.get(r.id);
      if (!tx) continue;
      const e = t - r.t0;
      const head = Math.min(1, e / r.travel);
      const tail = Math.max(0, Math.min(1, (e - r.lag) / r.travel));
      const fade = r.killT ? Math.max(0, 1 - (t - r.killT) / 120) : 1;
      gl.uniform1f(R.u.uHead, head);
      gl.uniform1f(R.u.uTail, tail);
      gl.uniform4f(R.u.uCol, r.col[0], r.col[1], r.col[2], r.col[3] * fade);
      gl.uniform1f(R.u.uTint, r.tint);
      gl.bindTexture(gl.TEXTURE_2D, tx.tex);
      gl.bindVertexArray(r.vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, r.count);
    }
    gl.disable(gl.BLEND);
    // 2. Bloom: the scene, downsampled and blurred.
    const Bl = progs.blur;
    gl.useProgram(Bl.p);
    gl.uniform1i(Bl.u.uTex, 0);
    gl.bindVertexArray(quadVao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fb);
    gl.viewport(0, 0, bw, bh);
    gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.uniform2f(Bl.u.uDir, 1.5 / W, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fb);
    gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.uniform2f(Bl.u.uDir, 0, 1 / bh);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fb);
    gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
    gl.uniform2f(Bl.u.uDir, 1 / bw, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // 3. Composite to the canvas, with distortion.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    const C = progs.composite;
    gl.useProgram(C.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.tex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(C.u.uScene, 0);
    gl.uniform1i(C.u.uBloom, 1);
    const fk = flashK > 0 ? flashK * Math.max(0, 1 - (t - flashT0) / flashDur) : 0;
    gl.uniform1f(C.u.uBloomK, bloomBase + fk * 2.2);
    gl.uniform1f(C.u.uTime, t);
    const wv = new Float32Array(16); const ww = new Float32Array(4);
    for (let i = waves.length - 1; i >= 0; i--) if (waves[i].t0 + waves[i].dur < t) waves.splice(i, 1);
    waves.forEach((w, i) => {
      const k = (t - w.t0) / w.dur;
      if (k < 0 || lowMotion) return;
      wv.set([w.x, w.y, w.radius * (0.15 + 0.85 * Math.sqrt(k)), w.strength * (1 - k)], i * 4);
      ww[i] = w.width;
    });
    gl.uniform4fv(C.u.uWave, wv);
    gl.uniform1fv(C.u.uWaveW, ww.map((x) => x || 1));
    if (heat && !lowMotion && t < heat.t0 + heat.dur) { const k = (t - heat.t0) / heat.dur; gl.uniform4f(C.u.uHeat, heat.x, heat.y, heat.radius, heat.strength * Math.sin(Math.PI * k)); } else gl.uniform4f(C.u.uHeat, 0, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
  }

  // Clears everything at once (a new match).
  function clear() {
    for (const pl of pools.values()) { pl.data.fill(0); pl.deathAt = 0; pl.dirtyFrom = 0; pl.dirtyTo = pl.cap - 1; pl.groups.clear(); }
    emitters.length = 0; waves.length = 0; heat = null;
    for (const r of ribbons) r.end = 0;
    wake();
  }

  return {
    gl, now, freeze, upload, has: (id) => textures.has(id), poolAlive: (id, t) => (pools.get(id)?.deathAt ?? 0) > t, isReal: (id) => !!textures.get(id)?.real, blendOf: (id) => textures.get(id)?.blend,
    spawn, ribbon, wave, shimmer, flash, emitter, kill, release, resize, clear, frameAspect, frameCount,
    set lowMotion(v) { lowMotion = !!v; }, set bloom(v) { bloomBase = v; },
    get running() { return running; }, get frames() { return frames; }, frameTimes, wake,
    get size() { return { w: W, h: H }; },
  };
}
