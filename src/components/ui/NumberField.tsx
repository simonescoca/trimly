import { useState } from 'react'
import { parseNumber } from '../../lib/number'
import s from './ui.module.css'

type Props = {
  label: string
  value: number
  unit?: string
  min?: number
  max?: number
  /** Digits after the decimal point that are kept (0 = integers). */
  decimals?: number
  onCommit: (value: number) => void
}

/** Numeric input that only reports a value when the user confirms it (Enter/blur). */
export function NumberField({ label, value, unit, min = 1, max = 100000, decimals = 0, onCommit }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  const factor = 10 ** decimals

  const commit = () => {
    if (draft === null) return
    const n = Math.round(parseNumber(draft) * factor) / factor
    setDraft(null)
    if (Number.isFinite(n) && n >= min) onCommit(Math.min(n, max))
  }

  return (
    <label className={s.numberField}>
      <input
        type="text"
        inputMode={decimals ? 'decimal' : 'numeric'}
        aria-label={label}
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={(e) => e.target.select()}
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
