import { Maximize, Minus, Plus, Redo2, RotateCcw, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type Dispatch, type KeyboardEvent, type PointerEvent } from 'react'
import { useI18n } from '../../i18n/context'
import type { LoadedImage } from '../../lib/decode'
import { moveRect, resizeRect, rotatedBounds, type Handle, type Rect, type Vec } from '../../lib/geometry'
import { drawWorldImage } from '../../lib/render'
import { FIT_VIEW, clampView, fitScale, worldToScreen, zoomAt, type Size, type View } from '../../lib/view'
import { aspectOf, canRedo, canUndo, frameOf, type Action, type EditorState } from '../../state/editor'
import { IconButton } from '../ui/Button'
import { CropOverlay } from './CropOverlay'
import s from './Stage.module.css'

type Props = {
  image: LoadedImage
  state: EditorState
  dispatch: Dispatch<Action>
}

type Interaction =
  | { kind: 'move'; start: Vec; crop: Rect }
  | { kind: 'resize'; start: Vec; crop: Rect; handle: Handle; minSize: number }
  | { kind: 'pan'; start: Vec; view: View }
  | { kind: 'pinch'; dist: number; mid: Vec; view: View }

const MIN_CROP_PX = 24
/** Circle knobs sit at 45° on the circle, not on the corner: scale the drag so they track the finger. */
const KNOB_GAIN = 1 / (0.5 + 0.5 / Math.SQRT2)
const WHEEL_STEP = 1.0015

const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl+'

export function Stage({ image, state, dispatch }: Props) {
  const { t } = useI18n()
  const hint = (label: string, keys: string) => `${label} (${keys})`
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })
  const [view, setView] = useState<View>(FIT_VIEW)
  const [active, setActive] = useState<Interaction['kind'] | null>(null)
  const interaction = useRef<Interaction | null>(null)
  const pointers = useRef(new Map<number, Vec>())

  const { doc } = state
  const frame = frameOf(state, doc)
  // Fit ignores the fine straighten angle so the view doesn't breathe while straightening.
  const bounds = rotatedBounds({ w: state.imageW, h: state.imageH, angle: (doc.rot90 * Math.PI) / 2 })
  const padding = size.w < 600 ? 20 : 44
  // The floating toolbar sits at the bottom: frame the picture in the area above it,
  // so no handle ends up hidden underneath.
  const toolbarSpace = size.w < 600 ? 56 : 64
  const area: Size = { w: size.w, h: Math.max(1, size.h - toolbarSpace) }
  const fit = size.w > 0 ? fitScale(area, bounds, padding) : 1
  const scale = fit * view.zoom
  const aspect = aspectOf(doc, state.imageW, state.imageH)

  // Track the stage size.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // A quarter turn changes the fitted size: go back to the full view.
  const [lastRot, setLastRot] = useState(doc.rot90)
  if (lastRot !== doc.rot90) {
    setLastRot(doc.rot90)
    setView(FIT_VIEW)
  }

  // Draw the image (the crop box is DOM on top, so moving it doesn't redraw).
  const { rot90, straighten, flipX, flipY } = doc
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size.w) return
    const dpr = window.devicePixelRatio || 1
    const w = Math.round(size.w * dpr)
    const h = Math.round(size.h * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const k = scale * dpr
    ctx.setTransform(k, 0, 0, k, dpr * (area.w / 2 - view.cx * scale), dpr * (area.h / 2 - view.cy * scale))
    // Use the full-resolution source only when zoomed in beyond the preview's detail.
    drawWorldImage(ctx, image, { rot90, straighten, flipX, flipY }, k > image.previewScale * 1.05)
  }, [image, rot90, straighten, flipX, flipY, view, scale, size, area.w, area.h])

  // ---------- Pointer interactions ----------
  const local = (e: { clientX: number; clientY: number }): Vec => {
    const r = rootRef.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const pinchInfo = () => {
    const [a, b] = [...pointers.current.values()]
    return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  }

  const endInteraction = useCallback(() => {
    const current = interaction.current
    interaction.current = null
    setActive(null)
    if (current && (current.kind === 'move' || current.kind === 'resize')) dispatch({ type: 'commit' })
  }, [dispatch])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const target = e.target as HTMLElement
    if (target.closest('[data-toolbar]')) return
    try {
      rootRef.current!.setPointerCapture(e.pointerId)
    } catch {
      /* synthetic or already-released pointers can't be captured; events still arrive */
    }
    const p = local(e)
    pointers.current.set(e.pointerId, p)

    if (pointers.current.size === 2) {
      // Second finger: switch to pinch-zoom, keeping whatever the first finger did.
      endInteraction()
      const { dist, mid } = pinchInfo()
      interaction.current = { kind: 'pinch', dist, mid, view }
      setActive('pinch')
      return
    }
    if (pointers.current.size > 2) return

    const handle = target.closest<HTMLElement>('[data-handle]')?.dataset.handle as Handle | undefined
    if (handle) {
      e.preventDefault()
      const minSize = Math.max(1, Math.min(MIN_CROP_PX / scale, doc.crop.w, doc.crop.h))
      interaction.current = { kind: 'resize', start: p, crop: doc.crop, handle, minSize }
      dispatch({ type: 'begin' })
      setActive('resize')
    } else if (target.closest('[data-crop]')) {
      interaction.current = { kind: 'move', start: p, crop: doc.crop }
      dispatch({ type: 'begin' })
      setActive('move')
    } else if (view.zoom > 1) {
      interaction.current = { kind: 'pan', start: p, view }
      setActive('pan')
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    const it = interaction.current
    if (!it) return

    if (it.kind === 'pinch') {
      if (pointers.current.size < 2) return
      const { dist, mid } = pinchInfo()
      const zoomed = zoomAt(it.view, dist / it.dist, it.mid, area, fit, bounds)
      // Then follow the fingers' midpoint.
      const k = fit * zoomed.zoom
      setView(clampView({ ...zoomed, cx: zoomed.cx - (mid.x - it.mid.x) / k, cy: zoomed.cy - (mid.y - it.mid.y) / k }, bounds, fit))
      return
    }
    const dx = (p.x - it.start.x) / scale
    const dy = (p.y - it.start.y) / scale
    if (it.kind === 'pan') {
      setView(clampView({ ...it.view, cx: it.view.cx - dx, cy: it.view.cy - dy }, bounds, fit))
    } else if (it.kind === 'move') {
      dispatch({ type: 'crop', crop: moveRect(it.crop, dx, dy, frame) })
    } else {
      const gain = doc.shape === 'circle' ? KNOB_GAIN : 1
      dispatch({ type: 'crop', crop: resizeRect(it.crop, it.handle, dx * gain, dy * gain, { img: frame, aspect, minSize: it.minSize }) })
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return
    const it = interaction.current
    if (it?.kind === 'pinch') {
      if (pointers.current.size < 2) {
        interaction.current = null
        setActive(null)
      }
      return
    }
    if (pointers.current.size === 0) endInteraction()
  }

  // Wheel / trackpad pinch zoom (needs a non-passive listener to stop page zoom).
  const wheelState = useRef({ view, fit, bounds, area })
  useEffect(() => {
    wheelState.current = { view, fit, bounds, area }
  })
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { view, fit, bounds, area } = wheelState.current
      const lines = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1
      const delta = e.deltaY * lines * (e.ctrlKey ? 6 : 1)
      const r = el.getBoundingClientRect()
      setView(zoomAt(view, Math.pow(WHEEL_STEP, -delta), { x: e.clientX - r.left, y: e.clientY - r.top }, area, fit, bounds))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // ---------- Keyboard ----------
  const zoomBy = useCallback(
    (factor: number) => setView((v) => zoomAt(v, factor, { x: area.w / 2, y: area.h / 2 }, area, fit, bounds)),
    [area.w, area.h, fit, bounds], // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? 'redo' : 'undo' })
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        dispatch({ type: 'redo' })
      } else if (!mod && (e.key === '+' || e.key === '=')) {
        zoomBy(1.25)
      } else if (!mod && (e.key === '-' || e.key === '_')) {
        zoomBy(0.8)
      } else if (!mod && e.key === '0') {
        setView(FIT_VIEW)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, zoomBy])

  const onCropKeyDown = (e: KeyboardEvent) => {
    const step = (e.shiftKey ? 10 : 1) / scale
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = moves[e.key]
    if (!m) return
    e.preventDefault()
    dispatch({ type: 'begin' })
    if (e.altKey) {
      // Alt + arrows resize from the bottom-right corner (keyboard alternative to the handles).
      const minSize = Math.max(1, Math.min(MIN_CROP_PX / scale, doc.crop.w, doc.crop.h))
      dispatch({ type: 'crop', crop: resizeRect(doc.crop, 'se', m[0], m[1], { img: frame, aspect, minSize }) })
    } else {
      dispatch({ type: 'crop', crop: moveRect(doc.crop, m[0], m[1], frame) })
    }
  }
  const onCropKeyUp = (e: KeyboardEvent) => {
    if (e.key.startsWith('Arrow')) dispatch({ type: 'commit' })
  }

  // ---------- Render ----------
  const tl = worldToScreen({ x: doc.crop.x, y: doc.crop.y }, view, scale, area)
  const screenRect = { x: tl.x, y: tl.y, w: doc.crop.w * scale, h: doc.crop.h * scale }
  const sizeLabel = `${Math.round(doc.crop.w)} × ${Math.round(doc.crop.h)}`
  const ringWidth = doc.shape !== 'rect' ? doc.borderWidth * Math.min(screenRect.w, screenRect.h) : 0

  return (
    <div
      ref={rootRef}
      className={[s.stage, view.zoom > 1 && s.pannable, active === 'pan' && s.panning].filter(Boolean).join(' ')}
      aria-label={t('stage.label')}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onLostPointerCapture={onPointerUp}
      data-zoom={view.zoom.toFixed(3)}
    >
      <canvas
        ref={canvasRef}
        className={s.canvas}
        data-testid="stage-canvas"
        data-image={`${image.width}x${image.height} ${image.format}${image.hasAlpha ? ' alpha' : ''}`}
      />
      {size.w > 0 && (
        <CropOverlay
          rect={screenRect}
          shape={doc.shape}
          roundness={doc.roundness}
          ring={{ width: ringWidth, color: doc.borderColor }}
          lockedRatio={aspect !== null}
          active={active === 'move' || active === 'resize'}
          sizeLabel={sizeLabel}
          worldRect={doc.crop}
          onKeyDown={onCropKeyDown}
          onKeyUp={onCropKeyUp}
        />
      )}
      <div className={s.toolbar} data-toolbar role="toolbar" aria-label={t('toolbar.label')}>
        <IconButton label={t('toolbar.undo')} title={hint(t('toolbar.undo'), `${MOD}Z`)} disabled={!canUndo(state)} onClick={() => dispatch({ type: 'undo' })}>
          <Undo2 size={18} />
        </IconButton>
        <IconButton label={t('toolbar.redo')} title={hint(t('toolbar.redo'), MOD === '⌘' ? '⇧⌘Z' : 'Ctrl+Y')} disabled={!canRedo(state)} onClick={() => dispatch({ type: 'redo' })}>
          <Redo2 size={18} />
        </IconButton>
        <span className={s.sep} />
        <IconButton label={t('toolbar.zoomOut')} title={hint(t('toolbar.zoomOut'), '−')} disabled={view.zoom <= 1} onClick={() => zoomBy(0.8)}>
          <Minus size={18} />
        </IconButton>
        <button type="button" className={`${s.zoomLabel} ${s.hideMobile}`} title={t('toolbar.fit')} onClick={() => setView(FIT_VIEW)}>
          {Math.round(scale * 100)}%
        </button>
        <IconButton label={t('toolbar.zoomIn')} title={hint(t('toolbar.zoomIn'), '+')} onClick={() => zoomBy(1.25)}>
          <Plus size={18} />
        </IconButton>
        <IconButton label={t('toolbar.fit')} title={hint(t('toolbar.fit'), '0')} disabled={view.zoom <= 1} onClick={() => setView(FIT_VIEW)}>
          <Maximize size={17} />
        </IconButton>
        <span className={s.sep} />
        <IconButton label={t('toolbar.reset')} disabled={isPristine(state)} onClick={() => dispatch({ type: 'reset' })}>
          <RotateCcw size={17} />
        </IconButton>
      </div>
    </div>
  )
}

function isPristine(state: EditorState) {
  const d = state.doc
  return d.rot90 === 0 && d.straighten === 0 && !d.flipX && !d.flipY && d.shape === 'rect' && d.ratioId === 'free' && d.crop.w === state.imageW && d.crop.h === state.imageH
}
