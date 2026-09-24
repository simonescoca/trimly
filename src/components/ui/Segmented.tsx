import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import s from './ui.module.css'

export type SegmentOption<T extends string> = { value: T; label: ReactNode; icon?: ReactNode; title?: string }

type Props<T extends string> = {
  label: string
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  compact?: boolean
  className?: string
}

/** Radio group styled as a segmented control; arrow keys move the selection. */
export function Segmented<T extends string>({ label, options, value, onChange, compact, className }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: KeyboardEvent) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const index = options.findIndex((o) => o.value === value)
    const next = options[(index + delta + options.length) % options.length]
    onChange(next.value)
    const buttons = ref.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    buttons?.[options.indexOf(next)]?.focus()
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      className={[s.segmented, compact && s.segmentedCompact, className].filter(Boolean).join(' ')}
      onKeyDown={onKeyDown}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          title={o.title}
          className={s.segment}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  )
}
