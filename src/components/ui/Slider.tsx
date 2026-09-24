import { useId, type CSSProperties } from 'react'
import s from './ui.module.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** Value restored on double click / Escape. */
  defaultValue?: number
  /** Fills the track from the centre (for signed values such as an angle). */
  centered?: boolean
  format?: (value: number) => string
  onChange: (value: number) => void
  /** Called when an interaction ends (pointer up, key up): used for undo history. */
  onCommit?: () => void
  disabled?: boolean
}

export function Slider({ label, value, min, max, step = 1, defaultValue, centered, format, onChange, onCommit, disabled }: Props) {
  const id = useId()
  const pct = ((value - min) / (max - min)) * 100
  const reset = () => {
    if (defaultValue === undefined || value === defaultValue) return
    onChange(defaultValue)
    onCommit?.()
  }
  return (
    <div className={s.slider}>
      <div className={s.sliderHead}>
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className={s.sliderValue}>
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className={[s.range, centered && s.centered].filter(Boolean).join(' ')}
        style={{ '--pct': `${pct}%` } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={(e) => {
          if (e.key === 'Escape') reset()
          else onCommit?.()
        }}
        onDoubleClick={reset}
      />
    </div>
  )
}
