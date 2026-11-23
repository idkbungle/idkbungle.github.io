/**
 * Retired and unused skies. Nothing imports this file, so none of these
 * show on the site. Kept so they are never lost: to bring one back, move
 * its line into PRESETS in ../palettes.ts.
 */

import type { SkyPalette } from '../palettes'

// Removed from the random pool on 2026-11-23.
export const RETIRED: SkyPalette[] = [
  { name: '紫晶', haze: ['#5a4dff', '#1f8fff'] },
  { name: '黄昏', haze: ['#d857ff', '#5a5cff'], glow: 0.65 },
  { name: '冰湖', haze: ['#19b8d8', '#2f6bff'] },
  { name: '极光', haze: ['#22e3a4', '#3a5bff'], glow: 0.6 },
  { name: '翡翠', haze: ['#3ddc84', '#d4d4d4'], glow: 0.5 },
]

// Previewed on 2026-11-23 but not picked.
export const UNUSED: SkyPalette[] = [
  { name: '薄荷', haze: ['#7dffcf', '#2fb3ff'], glow: 0.5 },
  { name: '霓虹', haze: ['#ff2bd6', '#00e5ff'], glow: 0.6 },
  { name: '青铜', haze: ['#c8873a', '#3a7d7a'], glow: 0.5 },
  { name: '野火', haze: ['#ff5a1f', '#ffd23f'], glow: 0.6 },
  { name: '孔雀', haze: ['#00b3a4', '#7a3dff'], glow: 0.55 },
  { name: '暗林', haze: ['#2e8b57', '#1f4fff'], glow: 0.5 },
]
