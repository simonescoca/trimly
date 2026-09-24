import type { KeyboardEvent } from 'react'
import { useI18n } from '../../i18n/context'
import type { Handle } from '../../lib/geometry'
import { cornerRadius } from '../../lib/render'
import type { Shape } from '../../state/editor'
import s from './Stage.module.css'

export type ScreenRect = { x: number; y: number; w: number; h: number }

type Props = {
  rect: ScreenRect
  shape: Shape
  roundness: number
  /** Border ring preview, in screen px (0 = none). */
  ring: { width: number; color: string }
  lockedRatio: boolean
  active: boolean
  /** Output size shown while interacting, e.g. "1080 × 1080". */
  sizeLabel: string
  /** Crop in image pixels, exposed as a data attribute for tests and debugging. */
  worldRect: ScreenRect
  onKeyDown: (e: KeyboardEvent) => void
  onKeyUp: (e: KeyboardEvent) => void
}

const CORNERS: Handle[] = ['nw', 'ne', 'sw', 'se']
const EDGES: Handle[] = ['n', 's', 'e', 'w']
/** Where a circle's knobs sit: on the circle, at 45°. */
const KNOB = 0.5 - 0.5 / Math.SQRT2

export function CropOverlay({ rect, shape, roundness, ring, lockedRatio, active, sizeLabel, worldRect, onKeyDown, onKeyUp }: Props) {
  const { t } = useI18n()
  const { x, y, w, h } = rect
  const radius = shape === 'circle' ? undefined : shape === 'rounded' ? cornerRadius(w, h, roundness) : 0
  const showEdges = shape !== 'circle' && Math.min(w, h) > 72

  const position = (handle: Handle) => {
    if (shape === 'circle') {
      const fx = handle.includes('w') ? KNOB : 1 - KNOB
      const fy = handle.includes('n') ? KNOB : 1 - KNOB
      return { left: x + w * fx, top: y + h * fy }
    }
    const fx = handle.includes('w') ? 0 : handle.includes('e') ? 1 : 0.5
    const fy = handle.includes('n') ? 0 : handle.includes('s') ? 1 : 0.5
    return { left: x + w * fx, top: y + h * fy }
  }

  const handles = [...CORNERS, ...(showEdges ? EDGES : [])]
  const labelTop = y > 34 ? y - 30 : y + 8

  return (
    <>
      <div
        data-crop
        data-testid="crop-box"
        data-rect={[worldRect.x, worldRect.y, worldRect.w, worldRect.h].map((v) => v.toFixed(2)).join(',')}
        tabIndex={0}
        role="group"
        aria-roledescription="crop"
        aria-label={t('crop.label', { size: sizeLabel })}
        className={[s.crop, shape === 'circle' && s.circle, active && s.active].filter(Boolean).join(' ')}
        style={{ left: x, top: y, width: w, height: h, borderRadius: radius }}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        <div className={s.grid} aria-hidden>
          <i />
          <i />
          <i />
          <i />
        </div>
        {ring.width > 0 && <div className={s.ring} style={{ borderWidth: ring.width, borderColor: ring.color }} />}
      </div>
      {handles.map((handle) => (
        <div
          key={handle}
          data-handle={handle}
          aria-hidden
          className={[
            s.handle,
            s[`cur-${handle}`],
            shape === 'circle' ? s.knob : CORNERS.includes(handle) ? `${s.corner} ${s[handle]}` : `${s.edge} ${s[handle]}`,
          ].join(' ')}
          style={position(handle)}
          title={t('crop.handle', { edge: t(`edge.${handle}`) })}
          data-locked={lockedRatio || undefined}
        />
      ))}
      {active && (
        <div className={s.size} style={{ left: x + w / 2, top: labelTop }} data-testid="crop-size">
          {sizeLabel}
        </div>
      )}
    </>
  )
}
