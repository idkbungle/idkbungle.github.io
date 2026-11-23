/**
 * The sky, as one fragment shader: two-tone haze from domain-warped value
 * noise along a diagonal band, and four parallax layers of grid-placed stars
 * (one candidate star per cell) that drift, twinkle, and the brightest of
 * which carry a soft halo and a thin cross. Output is premultiplied alpha
 * on a transparent canvas, so the page background shows through.
 * Written for this blog.
 */

export const VERTEX = /* glsl */ `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

export const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uRes;      // device pixels
uniform float uTime;    // seconds
uniform float uRatio;   // device pixels per CSS pixel
uniform vec2 uLean;     // eased pointer, -0.5..0.5
uniform vec3 uHazeA;    // sRGB 0..1
uniform vec3 uHazeB;
uniform float uGlow;    // haze strength 0..1
uniform float uTint;    // share of stars that take a haze colour
uniform float uIntro;   // 0..1 fade-in
out vec4 outColor;

float hash21(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
vec3 hash32(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.xxy + q.yzz) * q.zyx);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    s += a * noise(p);
    p = r * p * 2.03 + 1.7;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  float t = uTime;

  // ---- haze ----
  vec2 hp = uv * 1.7 - uLean * 0.03 + vec2(t * 0.006, t * 0.0025);
  float warp = fbm(hp * 0.8 + vec2(t * 0.01, -t * 0.007));
  float cloud = fbm(hp * 1.25 + warp * 1.3);
  float band = exp(-pow(dot(uv, normalize(vec2(-0.45, 0.9))) * 2.3, 2.0));
  float mist = smoothstep(0.36, 0.92, cloud * 0.85 + band * 0.38);
  float turn = smoothstep(0.32, 0.68, fbm(hp * 0.65 - vec2(5.3, 1.1) + t * 0.004));
  vec3 hazeColor = mix(uHazeA, uHazeB, turn);
  float hazeA = mist * uGlow * 0.42 * uIntro;

  // ---- stars ----
  vec3 starRGB = vec3(0.0);
  vec2 drift = vec2(-0.94, 0.34);
  for (int l = 0; l < 4; l++) {
    float fl = float(l);
    float z = (fl + 0.5) / 4.0;                 // 0 far .. 1 near
    float cell = mix(24.0, 120.0, z * z) * uRatio;
    vec2 p = frag + uLean * uRatio * (8.0 + 36.0 * z)
           + drift * t * uRatio * (2.5 + 12.0 * z) + fl * 517.3;
    vec2 g = p / cell;
    vec2 id = floor(g);
    vec3 h = hash32(id + fl * 31.7);
    // Not every cell has a star; far layers are fuller.
    if (fract(h.z * 7.31) > mix(0.85, 0.55, z)) continue;

    vec2 d = (fract(g) - (0.2 + 0.6 * h.xy)) * cell;
    float dist = length(d);
    float mag = h.z * h.z * h.z;                 // few bright, many dim
    float r = uRatio * (0.55 + 1.5 * mag) * mix(0.75, 1.15, z);
    float rr = max(r, 0.8);
    float tw = sin(t * (0.6 + 1.8 * h.x) + h.y * 6.2832) * sin(t * (0.27 + 0.5 * h.y) + h.x * 6.2832);
    float b = (0.4 + 0.6 * mag) * (1.0 - 0.45 * (0.5 + 0.5 * tw)) * (r / rr);
    float core = exp(-dist * dist / (rr * rr));
    float bright = smoothstep(0.45, 1.0, mag);
    float halo = 0.4 * exp(-dist / (rr * 2.8));
    float arms = 0.55 * exp(-min(abs(d.x), abs(d.y)) / (rr * 0.45) - dist / (rr * 6.0));
    float amount = (core + bright * (halo + arms)) * b * smoothstep(0.2 * cell, 0.1 * cell, dist);

    float k = fract(h.x * 7.13 + h.y * 3.11);
    vec3 tone = vec3(0.93, 0.95, 1.0);
    if (k < uTint) tone = mix(tone, (k < uTint * 0.5 ? uHazeA : uHazeB) * 0.8 + 0.25, 0.6);
    else if (k > 0.92) tone = vec3(1.0, 0.86, 0.66);
    starRGB += tone * amount * mix(0.75, 1.0, z);
  }
  starRGB = min(starRGB * uIntro, vec3(1.0));
  float starA = max(max(starRGB.r, starRGB.g), starRGB.b);

  // Stars over haze, premultiplied, with a little dither against banding.
  vec3 rgb = starRGB + hazeColor * hazeA * (1.0 - starA);
  float a = starA + hazeA * (1.0 - starA);
  float dither = (hash21(frag + fract(t)) - 0.5) / 255.0;
  rgb = clamp(rgb + dither, 0.0, 1.0);
  outColor = vec4(min(rgb, vec3(a)), a);
}`
