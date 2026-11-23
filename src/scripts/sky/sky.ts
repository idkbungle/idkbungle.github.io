/**
 * A tiny WebGL2 runner for the sky shader: sizes the canvas, runs the frame
 * loop only while the tab is visible, lowers resolution on slow devices,
 * eases the pointer, honours reduced motion, and cross-fades palettes in
 * OKLab. Written for this blog; no dependencies.
 */
import type { Vec3 } from './color'
import type { SkyPalette } from './palettes'
import { mixLab, oklabToRgb, parseColor, rgbToOklab } from './color'
import { FRAGMENT, VERTEX } from './shader'

export interface SkyHandle {
  setPalette: (palette: SkyPalette, ms?: number) => void
  destroy: () => void
}

interface Look { a: Vec3, b: Vec3, glow: number, tint: number }

function lookOf(p: SkyPalette): Look {
  return {
    a: rgbToOklab(parseColor(p.haze[0])),
    b: rgbToOklab(parseColor(p.haze[1])),
    glow: p.glow ?? 0.55,
    tint: p.tint ?? 0.22,
  }
}
const ease = (x: number) => x * x * (3 - 2 * x)

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? 'shader error')
  return s
}

export function createSky(canvas: HTMLCanvasElement, palette: SkyPalette): SkyHandle | null {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' })
  if (!gl)
    return null

  const program = gl.createProgram()!
  try {
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(program) ?? 'link error')
  }
  catch (err) {
    console.warn('[sky]', err)
    return null
  }
  gl.useProgram(program)
  gl.bindVertexArray(gl.createVertexArray())
  const u = (name: string) => gl.getUniformLocation(program, name)
  const loc = {
    res: u('uRes'),
    time: u('uTime'),
    ratio: u('uRatio'),
    lean: u('uLean'),
    a: u('uHazeA'),
    b: u('uHazeB'),
    glow: u('uGlow'),
    tint: u('uTint'),
    intro: u('uIntro'),
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let quality = window.matchMedia('(pointer: coarse)').matches ? 0.75 : 1
  let ratio = 1

  // Palette cross-fade.
  let from = lookOf(palette)
  let to = from
  let fadeStart = 0
  let fadeMs = 0

  // Clock, pointer, intro.
  let time = 8
  let last = performance.now()
  const born = last
  const lean = [0, 0]
  const leanTarget = [0, 0]
  let raf = 0
  let slowFrames = 0

  function resize() {
    ratio = Math.min(window.devicePixelRatio || 1, 2) * quality
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio))
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl!.viewport(0, 0, w, h)
  }

  function currentLook(now: number): Look {
    if (to === from || fadeMs <= 0)
      return to
    const k = Math.min(1, (now - fadeStart) / fadeMs)
    if (k >= 1) {
      from = to
      return to
    }
    const e = ease(k)
    return {
      a: mixLab(from.a, to.a, e),
      b: mixLab(from.b, to.b, e),
      glow: from.glow + (to.glow - from.glow) * e,
      tint: from.tint + (to.tint - from.tint) * e,
    }
  }

  function draw(now: number) {
    const look = currentLook(now)
    gl!.uniform2f(loc.res, canvas.width, canvas.height)
    gl!.uniform1f(loc.time, time)
    gl!.uniform1f(loc.ratio, ratio)
    gl!.uniform2f(loc.lean, lean[0], lean[1])
    gl!.uniform3fv(loc.a, oklabToRgb(look.a))
    gl!.uniform3fv(loc.b, oklabToRgb(look.b))
    gl!.uniform1f(loc.glow, look.glow)
    gl!.uniform1f(loc.tint, look.tint)
    gl!.uniform1f(loc.intro, still ? 1 : ease(Math.min(1, (now - born) / 1500)))
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
  }

  function frame(now: number) {
    raf = 0
    const dt = Math.min(0.1, (now - last) / 1000)
    last = now
    time += dt
    lean[0] += (leanTarget[0] - lean[0]) * 0.04
    lean[1] += (leanTarget[1] - lean[1]) * 0.04
    // Adaptive resolution: a run of slow frames drops the render scale.
    slowFrames = dt > 0.028 ? slowFrames + 1 : Math.max(0, slowFrames - 1)
    if (slowFrames > 45 && quality > 0.5) {
      quality = Math.max(0.5, quality - 0.15)
      slowFrames = 0
      resize()
    }
    draw(now)
    schedule()
  }

  function schedule() {
    if (still || raf || document.hidden)
      return
    raf = requestAnimationFrame(frame)
  }

  function redrawOnce() {
    resize()
    if (still || document.hidden) {
      // With reduced motion, run a short loop only while a cross-fade runs.
      const step = (now: number) => {
        draw(now)
        if (now - fadeStart < fadeMs)
          requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  }

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse')
      return
    leanTarget[0] = e.clientX / window.innerWidth - 0.5
    leanTarget[1] = 0.5 - e.clientY / window.innerHeight
  }
  const onVisibility = () => {
    last = performance.now()
    schedule()
  }
  const observer = new ResizeObserver(redrawOnce)

  observer.observe(canvas)
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  resize()
  draw(performance.now())
  schedule()

  return {
    setPalette(next, ms = 1600) {
      const now = performance.now()
      from = currentLook(now)
      to = lookOf(next)
      fadeStart = now
      fadeMs = ms
      if (still)
        redrawOnce()
    },
    destroy() {
      if (raf)
        cancelAnimationFrame(raf)
      raf = 0
      observer.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      gl!.clearColor(0, 0, 0, 0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
    },
  }
}
