/**
 * Two-colour skies. `haze` is the pair of colours the clouds drift between;
 * `glow` (0..1) how strongly the haze shows; `tint` (0..1) how many stars
 * pick up the haze colours. Add any pair you like: the random button logs
 * every sky it makes to the console in this exact shape.
 */

export interface SkyPalette {
  name: string
  haze: [string, string]
  glow?: number
  tint?: number
}

export const PRESETS: SkyPalette[] = [
  { name: '赤焰银河', haze: ['#ff1212', '#d4d4d4'], glow: 0.55 },
  { name: '熔金', haze: ['#ff9d1c', '#7a3dff'] },
  { name: '樱夜', haze: ['#ff5c9d', '#8f9bb3'], glow: 0.55 },
  { name: '深海', haze: ['#0fd1c4', '#c4c4cc'], glow: 0.5 },
  { name: '琥珀', haze: ['#ffb347', '#d4d4d4'], glow: 0.5 },
  { name: '星云', haze: ['#b14dff', '#ff4d6d'], glow: 0.6 },
  { name: '月白', haze: ['#e6e6f0', '#6f7cff'], glow: 0.45 },
  { name: '血月', haze: ['#b3122e', '#ff8a3d'], glow: 0.55 },
  { name: '薰衣草', haze: ['#b9a2ff', '#ffc2e2'], glow: 0.5 },
  { name: '玫瑰金', haze: ['#ffb4a2', '#c9a0ff'], glow: 0.5 },
  { name: '银河蓝', haze: ['#4d7cff', '#d4d4d4'], glow: 0.5 },
  { name: '晨曦', haze: ['#ffcf6b', '#ff6b8b'], glow: 0.55 },
  { name: '冰川', haze: ['#bfefff', '#5a7dff'], glow: 0.45 },
]
