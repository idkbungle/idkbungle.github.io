/**
 * Random two-colour skies that still look designed: hues are random, but
 * lightness and chroma stay in a band that glows nicely on a dark page, and
 * the two colours follow one of three pairing rules.
 */
import type { SkyPalette } from './palettes'
import { oklchToRgb, toHex } from './color'

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]
const wrap = (H: number) => ((H % 360) + 360) % 360
// Yellows and limes turn olive at mid lightness, so lift them.
const lift = (L: number, H: number) => (wrap(H) > 70 && wrap(H) < 130 ? Math.max(L, 0.8) : L)
const hex = (L: number, C: number, H: number) => toHex(oklchToRgb(lift(L, H), C, wrap(H)))

export function randomPalette(): SkyPalette {
  const h = rand(0, 360)
  const rule = pick(['analogous', 'complement', 'accent'] as const)
  let haze: [string, string]
  let name: string
  if (rule === 'analogous') {
    const gap = rand(30, 70) * pick([-1, 1])
    haze = [hex(rand(0.62, 0.72), rand(0.18, 0.25), h), hex(rand(0.58, 0.7), rand(0.16, 0.24), h + gap)]
    name = '随机 · 邻近色'
  }
  else if (rule === 'complement') {
    haze = [hex(rand(0.62, 0.72), rand(0.18, 0.25), h), hex(rand(0.6, 0.7), rand(0.14, 0.22), h + rand(150, 200))]
    name = '随机 · 对比色'
  }
  else {
    // A strong colour plus a near-neutral, like red with silver.
    haze = [hex(rand(0.6, 0.7), rand(0.2, 0.26), h), hex(rand(0.82, 0.9), rand(0, 0.02), h)]
    name = '随机 · 强调色'
  }
  return { name, haze, glow: Number(rand(0.45, 0.65).toFixed(2)) }
}
