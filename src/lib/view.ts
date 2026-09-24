// On-screen view of the world: which world point sits at the stage centre, and how zoomed in.
// zoom = 1 means "whole image fits the stage".
import type { Vec } from './geometry'

export type Size = { w: number; h: number }
export type View = { zoom: number; cx: number; cy: number }

export const FIT_VIEW: View = { zoom: 1, cx: 0, cy: 0 }
export const MIN_ZOOM = 1
/** Up to 8 screen pixels per image pixel, but always allow at least 4×. */
export const maxZoom = (fit: number) => Math.min(200, Math.max(4, 8 / fit))

export function fitScale(stage: Size, bounds: Size, padding: number): number {
  const w = Math.max(1, stage.w - padding * 2)
  const h = Math.max(1, stage.h - padding * 2)
  return Math.min(w / bounds.w, h / bounds.h)
}

export const worldToScreen = (p: Vec, view: View, scale: number, stage: Size): Vec => ({
  x: stage.w / 2 + (p.x - view.cx) * scale,
  y: stage.h / 2 + (p.y - view.cy) * scale,
})

export const screenToWorld = (p: Vec, view: View, scale: number, stage: Size): Vec => ({
  x: view.cx + (p.x - stage.w / 2) / scale,
  y: view.cy + (p.y - stage.h / 2) / scale,
})

/** Keeps the view centre over the image so it can't be panned away. */
export function clampView(view: View, bounds: Size, fit: number): View {
  const zoom = Math.min(maxZoom(fit), Math.max(MIN_ZOOM, view.zoom))
  if (zoom <= MIN_ZOOM + 1e-9) return { zoom: MIN_ZOOM, cx: 0, cy: 0 }
  const clamp = (v: number, half: number) => Math.min(half, Math.max(-half, v))
  return { zoom, cx: clamp(view.cx, bounds.w / 2), cy: clamp(view.cy, bounds.h / 2) }
}

/** Zooms by `factor`, keeping the world point under `anchor` (screen coords) where it is. */
export function zoomAt(view: View, factor: number, anchor: Vec, stage: Size, fit: number, bounds: Size): View {
  const before = screenToWorld(anchor, view, fit * view.zoom, stage)
  const zoom = Math.min(maxZoom(fit), Math.max(MIN_ZOOM, view.zoom * factor))
  const scale = fit * zoom
  const next = { zoom, cx: before.x - (anchor.x - stage.w / 2) / scale, cy: before.y - (anchor.y - stage.h / 2) / scale }
  return clampView(next, bounds, fit)
}
