import type { ButtonHTMLAttributes } from 'react'
import s from './ui.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }

export function Chip({ selected, className, ...rest }: Props) {
  return <button type="button" aria-pressed={selected} className={[s.chip, className].filter(Boolean).join(' ')} {...rest} />
}

export function Chips({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className={s.chips} role="group" aria-label={label}>
      {children}
    </div>
  )
}
