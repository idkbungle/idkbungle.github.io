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
  { name: '紫晶', haze: ['#5a4dff', '#1f8fff'] },
  { name: '黄昏', haze: ['#d857ff', '#5a5cff'], glow: 0.65 },
  { name: '冰湖', haze: ['#19b8d8', '#2f6bff'] },
  { name: '极光', haze: ['#22e3a4', '#3a5bff'], glow: 0.6 },
  { name: '熔金', haze: ['#ff9d1c', '#7a3dff'] },
  { name: '樱夜', haze: ['#ff5c9d', '#8f9bb3'], glow: 0.55 },
  { name: '深海', haze: ['#0fd1c4', '#c4c4cc'], glow: 0.5 },
  { name: '琥珀', haze: ['#ffb347', '#d4d4d4'], glow: 0.5 },
  { name: '星云', haze: ['#b14dff', '#ff4d6d'], glow: 0.6 },
  { name: '月白', haze: ['#e6e6f0', '#6f7cff'], glow: 0.45 },
  { name: '翡翠', haze: ['#3ddc84', '#d4d4d4'], glow: 0.5 },
]
