import { useState } from 'react'
import s from './ui.module.css'

type Props = {
  label: string
  value: number
  unit?: string
  min?: number
  max?: number
  onCommit: (value: number) => void
}

/** Numeric input that only reports a value when the user confirms it (Enter/blur). */
export function NumberField({ label, value, unit, min = 1, max = 100000, onCommit }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const n = Math.round(Number(draft))
    setDraft(null)
    if (Number.isFinite(n) && n >= min) onCommit(Math.min(n, max))
  }

  return (
    <label className={s.numberField}>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setDraft(null)
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
      {unit && <span>{unit}</span>}
    </label>
  )
}
