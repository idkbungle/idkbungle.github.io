/**
 * Small colour toolkit for the sky: parse hex / oklch() strings, convert
 * between sRGB, linear sRGB and OKLab, keep colours inside the sRGB gamut.
 * Written for this blog; no dependencies.
 */

export type Vec3 = [number, number, number]

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const linearToSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function rgbToOklab([r, g, b]: Vec3): Vec3 {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

/** OKLab to sRGB, unclamped (values outside 0..1 mean out of gamut). */
export function oklabToRgbRaw([L, a, b]: Vec3): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ]
}

const inGamut = (rgb: Vec3) => rgb.every(c => Number.isFinite(c) && c >= -1e-4 && c <= 1 + 1e-4)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** OKLCH (L 0..1, C, H degrees) to sRGB, lowering chroma until it fits. */
export function oklchToRgb(L: number, C: number, H: number): Vec3 {
  const h = (H * Math.PI) / 180
  let c = C
  for (let i = 0; i < 24; i++) {
    const rgb = oklabToRgbRaw([L, c * Math.cos(h), c * Math.sin(h)])
    if (inGamut(rgb))
      return rgb.map(clamp01) as Vec3
    c *= 0.9
  }
  return oklabToRgbRaw([L, 0, 0]).map(clamp01) as Vec3
}

export function oklabToRgb(lab: Vec3): Vec3 {
  const [L, a, b] = lab
  const C = Math.hypot(a, b)
  const H = (Math.atan2(b, a) * 180) / Math.PI
  return oklchToRgb(L, C, H)
}

/** Parse `#rgb`, `#rrggbb` or `oklch(L C H)` (L as 0..1 or %). */
export function parseColor(input: string): Vec3 {
  const s = input.trim().toLowerCase()
  if (s.startsWith('#')) {
    let hex = s.slice(1)
    if (hex.length === 3)
      hex = [...hex].map(ch => ch + ch).join('')
    const n = Number.parseInt(hex.slice(0, 6), 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const m = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/)
  if (m) {
    const L = Number(m[1]) / (m[2] ? 100 : 1)
    return oklchToRgb(L, Number(m[3]), Number(m[4]))
  }
  return [1, 1, 1]
}

export function toHex([r, g, b]: Vec3): string {
  return `#${[r, g, b].map(c => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('')}`
}

export function mixLab(a: Vec3, b: Vec3, t: number): Vec3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
}
